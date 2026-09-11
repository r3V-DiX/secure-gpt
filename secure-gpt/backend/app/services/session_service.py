# backend/app/services/session_service.py
#
# INDUSTRY STANDARD: Lazy Fingerprint Binding
#
# During OAuth callback the session is created server-side (Next.js BFF proxy).
# At that point we have no access to real browser headers (UA, screen res etc.).
# Binding a fingerprint here would always mismatch on subsequent browser requests.
#
# Solution (used by Auth0, Clerk, Supabase):
#   1. Create session with fingerprint_hash = None (unbound)
#   2. On the FIRST real authenticated request from the browser, bind the fingerprint
#   3. On subsequent requests, validate against the bound fingerprint
#
# EXTENSION BYPASS:
#   Requests from the Chrome extension background service worker carry the
#   X-Extension-Request: true header. These skip fingerprint binding/validation
#   entirely because service workers have unstable headers that would cause
#   constant false FINGERPRINT_MISMATCH revocations.
#   The session cookie is still fully validated for extension requests.

import secrets
import logging
from datetime import datetime, timezone, timedelta

from fastapi import Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.session import Session
from app.core.config import settings
from app.core.fingerprint import (
    compute_fingerprint,
    verify_fingerprint,
    is_extension_request,
)

logger = logging.getLogger(__name__)

SESSION_COOKIE_NAME = "sgpt_session"
SESSION_TTL_SECONDS = settings.session_max_age

# Header sent by BFF proxy to signal OAuth callback context
OAUTH_CALLBACK_HEADER = "x-oauth-callback"


async def create_session(
    db: AsyncSession,
    request: Request,
    response: Response,
    user_id: str,
) -> Session:
    """
    Create a new session.

    If the request comes from the BFF OAuth callback proxy (detected via
    X-OAuth-Callback header), the fingerprint is left unbound (None).
    It will be bound lazily on the first real browser request in validate_session().

    For all other session creation paths, fingerprint is bound immediately.
    Extension requests always leave fingerprint unbound.
    """
    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL_SECONDS)

    is_oauth_callback = request.headers.get(OAUTH_CALLBACK_HEADER) == "true"
    is_ext = is_extension_request(request)

    if is_oauth_callback or is_ext:
        fingerprint_hash = None
        logger.info(
            "Session created via %s — fingerprint unbound",
            "OAuth BFF proxy" if is_oauth_callback else "extension",
        )
    else:
        fingerprint_hash = compute_fingerprint(request)
        logger.info("Session created directly — fingerprint bound immediately")

    session = Session(
        id=session_id,
        user_id=user_id,
        fingerprint_hash=fingerprint_hash,
        user_agent=request.headers.get("user-agent"),
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()

    is_prod = settings.is_production

    logger.info("=== SETTING COOKIE ===")
    logger.info("  session_id      : %s...", session_id[:8])
    logger.info("  fingerprint     : %s", "unbound" if not fingerprint_hash else "bound")
    logger.info("  secure          : %s", is_prod)
    logger.info("  samesite        : lax")
    logger.info("  max_age         : %s", SESSION_TTL_SECONDS)

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        path="/",
    )

    logger.info("Session created for user %s", user_id)
    return session


from sqlalchemy.orm import selectinload

async def get_session(db: AsyncSession, session_id: str) -> Session | None:
    result = await db.execute(
        select(Session).options(selectinload(Session.user)).where(Session.id == session_id)
    )
    return result.scalar_one_or_none()


async def validate_session(
    db: AsyncSession,
    request: Request,
    session_id: str,
) -> tuple[Session | None, str | None]:
    """
    Validate a session and enforce fingerprint matching.

    EXTENSION BYPASS:
    Requests from the Chrome extension background service worker (detected via
    X-Extension-Request header) skip fingerprint validation entirely.
    The session cookie validity (expiry, revocation) is still fully checked.

    LAZY BINDING:
    If fingerprint_hash is None (session created via OAuth BFF proxy),
    we bind it on this first real browser request instead of rejecting.
    """
    logger.info("VALIDATE SESSION — id: %s...", session_id[:8] if session_id else "NONE")

    session = await get_session(db, session_id)

    if not session:
        logger.info("  result: SESSION_NOT_FOUND")
        return None, "SESSION_NOT_FOUND"

    if session.is_revoked:
        logger.info("  result: SESSION_REVOKED")
        return None, "SESSION_REVOKED"

    if session.is_expired:
        logger.info("  result: SESSION_EXPIRED")
        return session, "SESSION_EXPIRED"

    # ── Extension bypass — skip fingerprint entirely ───────────────────────
    if is_extension_request(request):
        logger.info("  result: VALID (extension request — fingerprint skipped)")
        await db.execute(
            update(Session)
            .where(Session.id == session_id)
            .values(last_active_at=datetime.now(timezone.utc))
        )
        return session, None

    current_fingerprint = compute_fingerprint(request)

    if session.fingerprint_hash is None:
        # ── Lazy bind: first real browser request after OAuth login ──────────
        logger.info("  fingerprint: unbound → binding now to first real request")
        await db.execute(
            update(Session)
            .where(Session.id == session_id)
            .values(
                fingerprint_hash=current_fingerprint,
                last_active_at=datetime.now(timezone.utc),
            )
        )
        logger.info("  result: VALID (fingerprint bound)")
        return session, None

    # ── Normal path: verify fingerprint ──────────────────────────────────────
    if not verify_fingerprint(request, session.fingerprint_hash):
        await revoke_session(db, session_id)
        logger.warning("  result: FINGERPRINT_MISMATCH — session revoked")
        return session, "FINGERPRINT_MISMATCH"

    # Update last active timestamp
    await db.execute(
        update(Session)
        .where(Session.id == session_id)
        .values(last_active_at=datetime.now(timezone.utc))
    )

    logger.info("  result: VALID")
    return session, None


async def revoke_session(db: AsyncSession, session_id: str) -> None:
    await db.execute(
        update(Session).where(Session.id == session_id).values(is_revoked=True)
    )
    await db.flush()


async def revoke_all_user_sessions(db: AsyncSession, user_id: str) -> int:
    result = await db.execute(
        update(Session)
        .where(Session.user_id == user_id, Session.is_revoked == False)  # noqa: E712
        .values(is_revoked=True)
    )
    await db.flush()
    return result.rowcount


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        secure=settings.is_production,
        httponly=True,
        samesite="none" if settings.is_production else "lax",
    )


def get_session_id_from_request(request: Request) -> str | None:
    cookie = request.cookies.get(SESSION_COOKIE_NAME)
    logger.info("GET SESSION FROM COOKIE — found: %s", bool(cookie))
    return cookie