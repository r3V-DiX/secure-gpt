# backend/app/api/v1/auth.py
# ─────────────────────────────────────────────────────────────────────────────
# Auth routes: email login/register + Google OAuth.
# Session is stored server-side via Starlette SessionMiddleware.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse
import httpx

from app.core.config import settings
from app.core.dependencies import DBSession, CurrentUser
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_user_by_email,
    upsert_google_user,
)
from app.schemas.auth_schema import LoginRequest, RegisterRequest, SessionResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


# ─── Email Auth ───────────────────────────────────────────────────────────────

@router.post("/register", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, request: Request, db: DBSession):
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = await create_user(db, body.email, body.full_name, body.password)
    request.session["user_id"] = user.id
    return SessionResponse(user=UserResponse.model_validate(user))


@router.post("/login", response_model=SessionResponse)
async def login(body: LoginRequest, request: Request, db: DBSession):
    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    request.session["user_id"] = user.id
    return SessionResponse(user=UserResponse.model_validate(user))


@router.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return UserResponse.model_validate(current_user)


# ─── Google OAuth ─────────────────────────────────────────────────────────────

@router.get("/google")
async def google_login():
    """Redirect user to Google's OAuth consent screen."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/google/callback")
async def google_callback(code: str, request: Request, db: DBSession):
    """Exchange code for token, fetch profile, upsert user, set session."""
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange token with Google")

        tokens = token_resp.json()
        access_token = tokens.get("access_token")

        # Fetch user profile
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

        profile = userinfo_resp.json()

    user = await upsert_google_user(
        db,
        google_id=profile["sub"],
        email=profile["email"],
        full_name=profile.get("name", ""),
        avatar_url=profile.get("picture"),
    )

    request.session["user_id"] = user.id

    # Redirect to dashboard
    frontend_url = settings.allowed_origins_list[0]
    return RedirectResponse(url=f"{frontend_url}/dashboard", status_code=302)