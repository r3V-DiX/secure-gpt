# backend/app/core/dependencies.py
# ─────────────────────────────────────────────────────────────────────────────
# FastAPI dependency injection helpers.
# ─────────────────────────────────────────────────────────────────────────────

from typing import Annotated
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_user_by_id

DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    request: Request,
    db: DBSession,
) -> User:
    """Read user_id from session and return the User ORM object."""
    user_id: str | None = request.session.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole):
    """Factory that returns a dependency enforcing one of the given roles."""

    async def _check(current_user: CurrentUser) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return Depends(_check)


# Convenience role guards
RequireSuperAdmin = require_roles(UserRole.SUPER_ADMIN)
RequireSecurityAdmin = require_roles(UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN)
RequireAuditor = require_roles(UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN, UserRole.AUDITOR)
RequireUser = require_roles(
    UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN, UserRole.AUDITOR, UserRole.USER
)