# ─────────────────────────────────────────────
# Auth Routes
# Google OAuth + token management
# ─────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.auth.service import (
    exchange_google_code,
    get_or_create_user,
    create_tokens_for_user,
    refresh_access_token,
)
from app.services.user.service import update_last_seen
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/google/url")
def get_google_auth_url() -> dict:
    """Return Google OAuth URL for the extension to open."""
    from app.core.config import settings
    import urllib.parse

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return {"url": url}


@router.post("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)) -> dict:
    """Exchange Google OAuth code for JWT tokens."""
    try:
        google_user = await exchange_google_code(code)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange Google OAuth code",
        )

    user = get_or_create_user(db, google_user)
    tokens = create_tokens_for_user(user)
    update_last_seen(db, user.id)

    return {
        "success": True,
        "data": {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "role": user.role,
                "org_id": user.org_id,
            },
            "tokens": tokens,
        },
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
    }


@router.post("/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)) -> dict:
    """Refresh access token using refresh token."""
    try:
        tokens = refresh_access_token(db, refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    return {"success": True, "data": tokens}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)) -> dict:
    """Return current authenticated user info."""
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "avatar_url": current_user.avatar_url,
            "role": current_user.role,
            "org_id": current_user.org_id,
            "department": current_user.department,
        },
    }


@router.post("/logout")
def logout() -> dict:
    """Client-side logout — invalidate token client-side."""
    # JWT is stateless — client should delete token
    # For enhanced security, implement token blacklist with Redis
    return {"success": True, "message": "Logged out successfully"}
