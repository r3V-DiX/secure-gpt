# backend/app/services/auth_event_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Auth event logging — append-only audit trail.
# All calls are fire-and-forget: logging failures never block the auth flow.
# ─────────────────────────────────────────────────────────────────────────────

import logging
from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_event import AuthEvent, AuthEventType
from app.core.fingerprint import compute_fingerprint

logger = logging.getLogger(__name__)


async def log_auth_event(
    db: AsyncSession,
    event_type: AuthEventType,
    success: bool,
    request: Request,
    user_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """
    Log an auth event. Never raises — failures are swallowed and logged.
    This ensures auth event logging never blocks or breaks the auth flow.
    """
    try:
        fingerprint = compute_fingerprint(request)

        event = AuthEvent(
            user_id=user_id,
            event_type=event_type,
            success=success,
            user_agent=request.headers.get("user-agent"),
            fingerprint_hash=fingerprint,
            metadata=metadata,
        )
        db.add(event)
        await db.flush()

    except Exception as exc:
        # Log but never propagate — auth logging is observability, not critical path
        logger.error("Failed to log auth event %s: %s", event_type, exc)


# ─── Convenience helpers ──────────────────────────────────────────────────────

async def log_login_success(
    db: AsyncSession, request: Request, user_id: str, session_id: str
) -> None:
    await log_auth_event(
        db, AuthEventType.LOGIN_SUCCESS, True, request,
        user_id=user_id,
        metadata={"session_id": session_id},
    )


async def log_login_failed(
    db: AsyncSession, request: Request, reason: str, email: str | None = None
) -> None:
    await log_auth_event(
        db, AuthEventType.LOGIN_FAILED, False, request,
        metadata={"reason": reason, "email": email},
    )


async def log_logout(
    db: AsyncSession, request: Request, user_id: str, session_id: str
) -> None:
    await log_auth_event(
        db, AuthEventType.LOGOUT, True, request,
        user_id=user_id,
        metadata={"session_id": session_id},
    )


async def log_fingerprint_mismatch(
    db: AsyncSession, request: Request, user_id: str, session_id: str
) -> None:
    await log_auth_event(
        db, AuthEventType.FINGERPRINT_MISMATCH, False, request,
        user_id=user_id,
        metadata={"session_id": session_id, "note": "Session revoked automatically"},
    )


async def log_session_expired(
    db: AsyncSession, request: Request, user_id: str, session_id: str
) -> None:
    await log_auth_event(
        db, AuthEventType.SESSION_EXPIRED, False, request,
        user_id=user_id,
        metadata={"session_id": session_id},
    )


async def log_oauth_failed(
    db: AsyncSession, request: Request, reason: str
) -> None:
    await log_auth_event(
        db, AuthEventType.OAUTH_FAILED, False, request,
        metadata={"reason": reason},
    )