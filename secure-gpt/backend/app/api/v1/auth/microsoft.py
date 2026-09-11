import logging
import secrets
from datetime import datetime, timedelta, timezone
import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.dependencies import DBSession
from app.core.exceptions import OAuthFailed
from app.core.ratelimit import LIMIT_AUTH, limiter
from app.models.session import Session
from app.models.user import User, UserRole
from app.services.auth_event_service import log_login_success, log_oauth_failed
from app.services.auth_service import get_user_by_email
from app.services.session_service import SESSION_COOKIE_NAME, SESSION_TTL_SECONDS

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/microsoft", summary="Redirect to Microsoft OAuth consent screen")
@limiter.limit(LIMIT_AUTH)
async def microsoft_login(request: Request):
    client_id = settings.microsoft_client_id or "placeholder_ms_client_id"
    tenant = settings.microsoft_tenant_id or "common"
    ms_auth_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize"
    params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": settings.microsoft_redirect_uri,
        "response_mode": "query",
        "scope": "openid email profile User.Read",
        "prompt": "select_account",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{ms_auth_url}?{query}")


@router.get("/microsoft/callback", summary="Microsoft OAuth callback")
@limiter.limit(LIMIT_AUTH)
async def microsoft_callback(
    request: Request,
    response: Response,
    db: DBSession,
    code: str | None = None,
    error: str | None = None,
):
    frontend_url = request.headers.get("origin") or "http://localhost:3000"
    is_prod = settings.app_env == "production"

    if error or not code:
        await log_oauth_failed(db, request, reason=error or "no_code_provided")
        await db.commit()
        return RedirectResponse(url=f"{frontend_url}/login?error=oauth_failed")

    client_id = settings.microsoft_client_id
    client_secret = settings.microsoft_client_secret
    tenant = settings.microsoft_tenant_id or "common"

    if not client_id or not client_secret:
        # Graceful development mode mock when azure keys not yet provisioned
        logger.warning("Microsoft OAuth credentials not configured — fallback demo account")
        email = "enterprise.user@microsoft.corp"
        name = "Enterprise User"
        ms_id = f"ms_mock_{code[:8]}"
    else:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                token_res = await client.post(
                    f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "redirect_uri": settings.microsoft_redirect_uri,
                        "grant_type": "authorization_code",
                    },
                )
                token_data = token_res.json()
                access_token = token_data.get("access_token")
                if not access_token:
                    raise OAuthFailed()

                graph_res = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                graph_user = graph_res.json()
                email = graph_user.get("mail") or graph_user.get("userPrincipalName")
                name = graph_user.get("displayName")
                ms_id = graph_user.get("id")
        except Exception as exc:
            logger.error("Microsoft token exchange failed: %s", exc)
            return RedirectResponse(url=f"{frontend_url}/login?error=oauth_failed")

    user = await get_user_by_email(db, email)
    if not user:
        user = User(
            email=email.lower(),
            full_name=name,
            role=UserRole.EMPLOYEE,
            is_active=True,
            privacy_accepted=True,
        )
        db.add(user)
        await db.flush()

    session_id = secrets.token_urlsafe(32)
    session = Session(
        id=session_id,
        user_id=user.id,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL_SECONDS),
    )
    db.add(session)
    await log_login_success(db, request, user_id=user.id, session_id=session.id)
    await db.commit()

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
