# backend/app/services/auth_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Auth service — handles login, register, Google OAuth user upsert.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, AuthProvider, UserRole
from app.core.security import hash_password, verify_password


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_google_id(db: AsyncSession, google_id: str) -> User | None:
    result = await db.execute(select(User).where(User.google_id == google_id))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    email: str,
    full_name: str,
    password: str | None = None,
    role: UserRole = UserRole.USER,
) -> User:
    user = User(
        email=email.lower(),
        full_name=full_name,
        hashed_password=hash_password(password) if password else None,
        auth_provider=AuthProvider.EMAIL,
        role=role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def upsert_google_user(
    db: AsyncSession,
    google_id: str,
    email: str,
    full_name: str,
    avatar_url: str | None,
) -> User:
    """Create or update a user from Google OAuth data."""
    # 1. Try find by google_id
    user = await get_user_by_google_id(db, google_id)

    # 2. Try find by email (user might have registered with email before)
    if not user:
        user = await get_user_by_email(db, email)

    if user:
        # Update existing user with Google info
        user.google_id = google_id
        user.avatar_url = avatar_url or user.avatar_url
        user.full_name = full_name or user.full_name
        user.auth_provider = AuthProvider.GOOGLE
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
        auth_provider=AuthProvider.GOOGLE,
        role=UserRole.USER,
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User | None:
    user = await get_user_by_email(db, email)
    if not user or not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None

    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()
    return user