# backend/app/core/dependencies.py
# ─────────────────────────────────────────────────────────────────────────────
# FastAPI dependency injection.
# Session-based auth — reads cookie, validates against DB, checks fingerprint.
# No JWT. No localStorage. Pure httpOnly cookie + server-side session.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timezone
from typing import Annotated

from app.core.database import get_db
from app.core.exceptions import (
    AccountDeletionPending,
    AuthRequired,
    FingerprintMismatch,
    Forbidden,
    SessionExpired,
    SessionRevoked,
    UserInactive,
)

# FIX: AuthEventType lives in models/auth_event.py, not auth_event_service
from app.models.auth_event import AuthEventType
from app.models.user import User, UserRole
from app.services import auth_event_service
from app.services.auth_service import get_user_by_id
from app.services.session_service import (
    get_session_id_from_request,
    validate_session,
)
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    request: Request,
    db: DBSession,
) -> User:
    """
    Full session validation dependency.

    Flow:
    1. Read session ID from httpOnly cookie
    2. Look up session in DB
    3. Check revoked / expired
    4. Verify fingerprint (mismatch → revoke + log)
    5. Load user, check is_active
    6. Attach user_id to request.state for rate limiter key function
    """
    session_id = get_session_id_from_request(request)
    if not session_id:
        raise AuthRequired()

    session, error_code = await validate_session(db, request, session_id)

    if error_code == "SESSION_REVOKED":
        await auth_event_service.log_auth_event(
            db,
            event_type=AuthEventType.SESSION_INVALIDATED,
            success=False,
            request=request,
            metadata={"session_id": session_id},
        )
        raise SessionRevoked()

    if error_code == "SESSION_EXPIRED":
        await auth_event_service.log_session_expired(
            db,
            request=request,
            user_id=session.user_id if session else None,
            session_id=session_id,
        )
        raise SessionExpired()

    if error_code == "FINGERPRINT_MISMATCH":
        # Session already revoked by validate_session — log and raise
        await auth_event_service.log_fingerprint_mismatch(
            db,
            request=request,
            user_id=session.user_id if session else None,
            session_id=session_id,
        )
        raise FingerprintMismatch()

    # Load user (use eagerly-loaded session.user if available)
    user = session.user if session and getattr(session, "user", None) else await get_user_by_id(db, session.user_id)
    if not user:
        raise AuthRequired("User account not found")

    if not user.is_active:
        # Check if they are in the 45-day grace period
        if user.deactivated_at and (datetime.now(timezone.utc) - user.deactivated_at).days <= 45:
            path = request.url.path
            # Allow auth endpoints (me, logout, restore) to bypass the block so they can load/restore the profile
            if not (path.endswith(("/auth/me", "/auth/logout", "/auth/restore"))):
                raise AccountDeletionPending(
                    details={"email": user.email, "deactivated_at": user.deactivated_at.isoformat()}
                )
        else:
            raise UserInactive()

    # Attach session attributes to request.state
    request.state.user_id = user.id
    request.state.is_impersonation = session.is_impersonation if session else False
    request.state.impersonator_id = session.impersonator_id if session else None

    # Read-only enforcement during tenant impersonation
    if request.state.is_impersonation:
        # Permit safe read methods; block state mutations
        if request.method.upper() not in ("GET", "HEAD", "OPTIONS"):
            allowed_mutation_paths = (
                "/api/v1/auth/impersonate/exit",
                "/api/v1/auth/logout",
            )
            if not request.url.path.endswith(allowed_mutation_paths):
                raise Forbidden("Action prohibited during tenant impersonation (read-only mode)")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole | str):
    """Factory that returns a dependency enforcing one of the given roles."""
    normalized_roles = set()
    for r in roles:
        if isinstance(r, (list, tuple, set)):
            for sub in r:
                normalized_roles.add(sub.value if hasattr(sub, "value") else str(sub).lower())
        else:
            normalized_roles.add(r.value if hasattr(r, "value") else str(r).lower())

    async def _check(current_user: CurrentUser) -> User:
        user_role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).lower()
        if user_role_val not in normalized_roles:
            raise Forbidden()
        return current_user

    return Depends(_check)


def has_permission(action: str):
    """
    Dependency that raises Forbidden if the current user lacks the specified permission.
    """
    async def _check(
        current_user: CurrentUser,
        db: DBSession,
    ) -> User:
        # Organization Admins, Security Admins, and Super Admins have inherent policy management rights
        if current_user.role in (UserRole.ORG_ADMIN, UserRole.SECURITY_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN):
            return current_user

        from app.services.rbac_service import get_user_permissions
        user_perms = await get_user_permissions(db, current_user.id)
        if action not in user_perms:
            if current_user.org_id is None and action.startswith("policy:"):
                pass
            else:
                raise Forbidden(f"Missing required permission: {action}")
        return current_user

    return Depends(_check)


def require_role_slug(*role_slugs: str):
    """
    Dependency that raises Forbidden if the current user lacks all of the specified roles.
    """
    async def _check(
        current_user: CurrentUser,
        db: DBSession,
    ) -> User:
        from app.services.rbac_service import get_user_roles
        user_roles = await get_user_roles(db, current_user.id)
        slugs = {r.slug for r in user_roles}
        if not any(slug in slugs for slug in role_slugs):
            raise Forbidden(f"Required role(s): {', '.join(role_slugs)}")
        return current_user

    return Depends(_check)


# Convenience role guards — kept for future admin backend
RequireSuperAdmin = require_roles(UserRole.SUPER_ADMIN)
RequireSecurityAdmin = require_roles(UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN)
RequireAuditor = require_roles(
    UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN, UserRole.AUDITOR
)