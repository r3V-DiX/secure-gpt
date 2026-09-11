import logging
import secrets
from datetime import datetime, timedelta, timezone
import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.config import settings
from app.core.dependencies import DBSession
from app.core.exceptions import OAuthFailed, UserInactive
from app.core.ratelimit import LIMIT_AUTH, limiter
from app.models.session import Session
from app.services.auth_event_service import log_login_failed, log_login_success, log_oauth_failed
from app.services.auth_service import upsert_google_user
from app.services.session_service import SESSION_COOKIE_NAME, SESSION_TTL_SECONDS

logger = logging.getLogger(__name__)
router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/google", summary="Redirect to Google OAuth consent screen")
@limiter.limit(LIMIT_AUTH)
async def google_login(request: Request):
    logger.info("GOOGLE LOGIN — redirect_uri being sent to Google: %s", settings.google_redirect_uri)
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


@router.get("/google/callback", summary="Google OAuth callback")
@limiter.limit(LIMIT_AUTH)
async def google_callback(
    request: Request,
    response: Response,
    db: DBSession,
    code: str | None = None,
    error: str | None = None,
):
    frontend_url = settings.frontend_url
    is_prod = settings.is_production
    is_oauth_callback = request.headers.get("X-Forwarded-Host", "") == "localhost:3000"

    if error or not code:
        await log_oauth_failed(db, request, reason=error or "no_code")
        await db.commit()
        if is_oauth_callback:
            return JSONResponse(status_code=400, content={"error": "oauth_failed"})
        return RedirectResponse(url=f"{frontend_url}/login?error=oauth_failed")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_res = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise OAuthFailed()

            userinfo_res = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            userinfo = userinfo_res.json()
    except Exception as exc:
        logger.error("OAuth token exchange failed: %s", exc)
        await log_oauth_failed(db, request, reason=str(exc))
        await db.commit()
        if is_oauth_callback:
            return JSONResponse(status_code=400, content={"error": "oauth_failed"})
        return RedirectResponse(url=f"{frontend_url}/login?error=oauth_failed")

    email = userinfo.get("email")
    google_id = userinfo.get("sub")
    name = userinfo.get("name")
    avatar = userinfo.get("picture")

    if not email or not google_id:
        raise OAuthFailed()

    user = await upsert_google_user(db, google_id=google_id, email=email, full_name=name, avatar_url=avatar)

    if not user.is_active:
        if user.deactivated_at and (datetime.now(timezone.utc) - user.deactivated_at).days <= 45:
            # Reactivate user account if within 45 days grace period
            user.is_active = True
            user.deactivated_at = None
            user.deactivation_reason = None
            await db.flush()
        else:
            await log_login_failed(db, request, reason="user_inactive", email=user.email)
            await db.commit()
            raise UserInactive()

    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL_SECONDS)

    session = Session(
        id=session_id,
        user_id=user.id,
        fingerprint_hash=None,
        user_agent=request.headers.get("user-agent"),
        expires_at=expires_at,
    )
    db.add(session)
    await log_login_success(db, request, user_id=user.id, session_id=session.id)
    await db.commit()

    if is_oauth_callback:
        json_response = JSONResponse(status_code=200, content={"ok": True})
        json_response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_id,
            max_age=SESSION_TTL_SECONDS,
            httponly=True,
            secure=is_prod,
            samesite="none" if is_prod else "lax",
            path="/",
        )
        return json_response
    else:
        redirect_response = RedirectResponse(url=f"{frontend_url}/callback", status_code=302)
        redirect_response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_id,
            max_age=SESSION_TTL_SECONDS,
            httponly=True,
            secure=is_prod,
            samesite="none" if is_prod else "lax",
            path="/",
        )
        return redirect_response
