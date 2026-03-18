# ─────────────────────────────────────────────
# Auth Service
# Google OAuth + JWT token management
# ─────────────────────────────────────────────

import httpx
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.models.org import Org
import uuid


GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


async def exchange_google_code(code: str) -> dict:
    """Exchange OAuth code for Google user info."""
    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        token_response.raise_for_status()
        tokens = token_response.json()

        # Fetch user info
        user_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        user_response.raise_for_status()
        return user_response.json()


def get_or_create_user(db: Session, google_user: dict) -> User:
    """Find existing user or create new one from Google profile."""
    # Try find by google_id first
    user = db.query(User).filter(User.google_id == google_user["id"]).first()

    if user:
        # Update profile info in case it changed
        user.name = google_user.get("name", user.name)
        user.avatar_url = google_user.get("picture", user.avatar_url)
        db.commit()
        db.refresh(user)
        return user

    # Try find by email
    user = db.query(User).filter(User.email == google_user["email"]).first()
    if user:
        user.google_id = google_user["id"]
        user.avatar_url = google_user.get("picture", user.avatar_url)
        db.commit()
        db.refresh(user)
        return user

    # Create new user — also create a default org for them
    org = Org(
        id=str(uuid.uuid4()),
        name=f"{google_user.get('name', 'My')} Org",
        admin_email=google_user["email"],
        plan="free",
    )
    db.add(org)
    db.flush()

    user = User(
        id=str(uuid.uuid4()),
        email=google_user["email"],
        name=google_user.get("name", ""),
        avatar_url=google_user.get("picture"),
        google_id=google_user["id"],
        role="USER",
        org_id=org.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_tokens_for_user(user: User) -> dict:
    """Create access + refresh token pair for a user."""
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "org_id": user.org_id,
    }
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def refresh_access_token(db: Session, refresh_token: str) -> dict:
    """Validate refresh token and issue new access token."""
    try:
        payload = decode_token(refresh_token)
    except ValueError:
        raise ValueError("Invalid refresh token")

    if payload.get("type") != "refresh":
        raise ValueError("Not a refresh token")

    user = db.query(User).filter(
        User.id == payload["sub"],
        User.is_active == True,
    ).first()

    if not user:
        raise ValueError("User not found")

    return create_tokens_for_user(user)
