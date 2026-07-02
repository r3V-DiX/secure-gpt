# backend/app/services/auth_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Auth service — Google OAuth only.
# No email/password. No JWT. Session-based.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_google_id(db: AsyncSession, google_id: str) -> User | None:
    result = await db.execute(select(User).where(User.google_id == google_id))
    return result.scalar_one_or_none()


async def upsert_google_user(
    db: AsyncSession,
    google_id: str,
    email: str,
    full_name: str,
    avatar_url: str | None,
) -> User:
    """
    Create or update a user from Google OAuth profile.
    Lookup order: google_id → email → create new.
    """
    # 1. Try find by google_id (most common path after first login)
    user = await get_user_by_google_id(db, google_id)

    # 2. Try find by email (account existed before Google auth)
    if not user:
        user = await get_user_by_email(db, email)

    if user:
        # Update Google fields
        user.google_id = google_id
        user.avatar_url = avatar_url or user.avatar_url
        user.full_name = full_name or user.full_name
        user.last_login_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(user)
        return user

    # 3. Create new user
    user = User(
        email=email.lower(),
        full_name=full_name,
        avatar_url=avatar_url,
        google_id=google_id,
        role=UserRole.USER,
        last_login_at=datetime.now(timezone.utc),
        privacy_accepted=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user