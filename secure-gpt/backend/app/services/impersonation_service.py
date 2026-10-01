# backend/app/services/impersonation_service.py
import secrets
import logging
import hashlib
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update

from app.models.session import Session
from app.models.impersonation_handoff import ImpersonationHandoff
from app.models.user import User, UserRole
from app.models.org import Organisation
from app.core.exceptions import BadRequest

logger = logging.getLogger(__name__)

HANDOFF_TTL_SECONDS = 120
IMPERSONATION_TTL_SECONDS = 900


async def create_impersonation_session(
    db: AsyncSession,
    target_user_id: str,
    impersonator_id: str,
    previous_session_id: str | None = None,
    ttl_seconds: int = IMPERSONATION_TTL_SECONDS,
) -> Session:
    """Create a short-lived impersonation session for Super Admin inspection."""
    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

    session = Session(
        id=session_id,
        user_id=target_user_id,
        impersonator_id=impersonator_id,
        previous_session_id=previous_session_id,
        fingerprint_hash=None,  # Unbound for seamless dashboard redirection
        expires_at=expires_at,
        last_active_at=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.flush()

    logger.info("Impersonation session created: target=%s by impersonator=%s", target_user_id, impersonator_id)
    return session


async def create_impersonation_handoff(
    db: AsyncSession, target_user_id: str, impersonator_id: str, org_id: str
) -> str:
    ticket = secrets.token_urlsafe(32)
    db.add(ImpersonationHandoff(
        token_hash=hashlib.sha256(ticket.encode()).hexdigest(),
        target_user_id=target_user_id,
        impersonator_id=impersonator_id,
        org_id=org_id,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=HANDOFF_TTL_SECONDS),
    ))
    await db.flush()
    return ticket


async def redeem_impersonation_handoff(db: AsyncSession, ticket: str) -> tuple[str, str]:
    """Atomically consume a ticket and recheck both users and its tenant."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(ImpersonationHandoff)
        .where(
            ImpersonationHandoff.token_hash == hashlib.sha256(ticket.encode()).hexdigest(),
            ImpersonationHandoff.redeemed_at.is_(None),
            ImpersonationHandoff.expires_at > now,
        )
        .values(redeemed_at=now)
        .returning(
            ImpersonationHandoff.target_user_id,
            ImpersonationHandoff.impersonator_id,
            ImpersonationHandoff.org_id,
        )
    )
    row = result.one_or_none()
    if row is None:
        raise BadRequest("Impersonation handoff is expired or already used")

    target = await db.get(User, row.target_user_id)
    impersonator = await db.get(User, row.impersonator_id)
    org = await db.get(Organisation, row.org_id)
    if (
        target is None or not target.is_active or target.org_id != row.org_id
        or impersonator is None or not impersonator.is_active
        or impersonator.role not in (UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)
        or org is None or not org.is_active
    ):
        raise BadRequest("Impersonation handoff is no longer valid")
    return target.id, impersonator.id
