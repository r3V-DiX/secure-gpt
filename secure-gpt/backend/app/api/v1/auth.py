# backend/app/api/v1/auth.py
#
# Authentication Endpoints:
# - Google OAuth
# - Email OTP (Request & Verify)
# - Developer Quick-Bypass with Role Dropdown (Employer / Employee / Personal User)

import logging
import secrets
import random
import hashlib
from datetime import datetime, timedelta, timezone

import httpx
from app.core.config import settings
from app.core.dependencies import CurrentUser, DBSession
from app.core.exceptions import OAuthFailed, UserInactive, Forbidden, BadRequest, NotFound
from app.core.fingerprint import compute_fingerprint
from app.core.ratelimit import LIMIT_AUTH, LIMIT_AUTH_ME, LIMIT_LOGOUT, limiter
from app.core.response import success
from app.models.session import Session
from app.models.user import User, UserRole
from app.models.otp_code import OTPCode
from app.services.auth_event_service import (
    log_login_failed,
    log_login_success,
    log_logout,
    log_oauth_failed,
)
from app.services.auth_service import upsert_google_user, get_user_by_email
from app.services.email_service import send_otp_email
from app.services.session_service import (
    SESSION_COOKIE_NAME,
    SESSION_TTL_SECONDS,
    clear_session_cookie,
    get_session_id_from_request,
    revoke_session,
)
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


# ── 1. Google OAuth ───────────────────────────────────────────────────────────

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


# ── 2. Email OTP Authentication ───────────────────────────────────────────────

class OTPRequest(BaseModel):
    email: EmailStr
    role_type: str | None = "user"  # "employer", "employee", "user"


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    code: str
    role_type: str | None = "user"


@router.post("/otp/request", summary="Request 6-digit OTP code to email")
@limiter.limit(LIMIT_AUTH)
async def request_otp(request: Request, body: OTPRequest, db: DBSession):
    email_clean = body.email.strip().lower()

    # Generate 6-digit code
    otp_val = f"{random.randint(100000, 999999)}"
    hashed_otp = hashlib.sha256(otp_val.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Delete older codes for this email
    await db.execute(delete(OTPCode).where(OTPCode.email == email_clean))

    otp_code_obj = OTPCode(
        email=email_clean,
        code=hashed_otp,
        attempts=0,
        expires_at=expires_at,
    )
    db.add(otp_code_obj)
    await db.flush()

    # Send verification email asynchronously
    await send_otp_email(email_clean, otp_val)
    await db.commit()

    return success(
        message=f"6-digit verification code has been dispatched to {email_clean}.",
        data={"email": email_clean}
    )


@router.post("/otp/verify", summary="Verify OTP code and create session")
@limiter.limit(LIMIT_AUTH)
async def verify_otp(request: Request, response: Response, body: OTPVerifyRequest, db: DBSession):
    email_clean = body.email.strip().lower()
    code_clean = body.code.strip()

    res = await db.execute(select(OTPCode).where(OTPCode.email == email_clean))
    otp_record = res.scalar_one_or_none()

    if not otp_record:
        raise BadRequest("No verification code found. Please request a new code.")

    if datetime.now(timezone.utc) > otp_record.expires_at:
        await db.execute(delete(OTPCode).where(OTPCode.email == email_clean))
        await db.commit()
        raise BadRequest("Verification code has expired. Please request a new one.")

    hashed_input = hashlib.sha256(code_clean.encode()).hexdigest()
    if otp_record.code != hashed_input:
        otp_record.attempts += 1
        await db.commit()
        if otp_record.attempts >= 5:
            await db.execute(delete(OTPCode).where(OTPCode.email == email_clean))
            await db.commit()
            raise BadRequest("Too many failed attempts. Code invalidated.")
        raise BadRequest("Invalid verification code.")

    # Code matches — delete record
    await db.execute(delete(OTPCode).where(OTPCode.email == email_clean))

    # Fetch or auto-create user
    user = await get_user_by_email(db, email_clean)
    if not user:
        # Determine initial role from role_type
        assigned_role = UserRole.USER
        if body.role_type == "employer":
            assigned_role = UserRole.ORG_ADMIN
        elif body.role_type == "employee":
            assigned_role = UserRole.EMPLOYEE

        user = User(
            email=email_clean,
            full_name=email_clean.split("@")[0].replace(".", " ").title(),
            role=assigned_role,
            is_active=True,
            privacy_accepted=True,
        )
        db.add(user)
        await db.flush()

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

    resp = JSONResponse(
        content={
            "success": True,
            "data": {
                "id": user.id,
                "email": user.email,
                "role": user.role.value,
            },
            "message": f"Successfully verified and signed in as {user.email}",
        }
    )
    resp.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
        path="/",
    )
    return resp


# ── 3. Developer Login with Persona Dropdown ──────────────────────────────────

class DevLoginRequest(BaseModel):
    email: EmailStr
    persona: str = "employer"  # "employer" | "employee" | "user"


@router.post("/dev-login", summary="Bypass authentication with Persona selection")
async def dev_login(request: Request, body: DevLoginRequest, db: DBSession):
    if settings.app_env != "development":
        raise Forbidden("Developer login is only available in development environment")

    email_clean = body.email.strip().lower()
    user = await get_user_by_email(db, email_clean)

    if not user:
        role_map = {
            "employer": UserRole.ORG_ADMIN,
            "employee": UserRole.EMPLOYEE,
            "user": UserRole.USER,
        }
        assigned_role = role_map.get(body.persona, UserRole.USER)

        user = User(
            email=email_clean,
            full_name=email_clean.split("@")[0].title(),
            role=assigned_role,
            is_active=True,
            privacy_accepted=True,
        )
        db.add(user)
        await db.flush()

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

    resp = JSONResponse(content={"ok": True, "message": f"Logged in as {user.email} ({user.role.value})"})
    resp.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
        path="/",
    )
    return resp


# ── 4. Session & Account Management ───────────────────────────────────────────

@router.get("/me", summary="Get current authenticated user")
@limiter.limit(LIMIT_AUTH_ME)
async def get_me(request: Request, current_user: CurrentUser, db: DBSession):
    from app.services.rbac_service import get_user_permissions, get_user_roles
    from app.models.org import Organisation
    from app.services.org_service import extract_domain_from_email, is_public_domain

    if not current_user.org_id:
        user_domain = extract_domain_from_email(current_user.email)
        if user_domain and not is_public_domain(user_domain):
            org_res = await db.execute(select(Organisation).where(Organisation.domain == user_domain))
            matched_org = org_res.scalar_one_or_none()
            if matched_org:
                current_user.org_id = matched_org.id
                await db.commit()

    roles = await get_user_roles(db, current_user.id)
    permissions = await get_user_permissions(db, current_user.id)
    return success(
        data={
            "id": current_user.id,
            "email": current_user.email,
            "fullName": current_user.full_name,
            "avatarUrl": current_user.avatar_url,
            "role": current_user.role.value,
            "isActive": current_user.is_active,
            "orgId": current_user.org_id,
            "departmentId": current_user.department_id,
            "createdAt": current_user.created_at.isoformat(),
            "lastLoginAt": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
            "deactivatedAt": current_user.deactivated_at.isoformat() if current_user.deactivated_at else None,
            "deactivationReason": current_user.deactivation_reason,
            "roles": [r.slug for r in roles],
            "permissions": list(permissions),
        },
        message="User fetched successfully",
    )


@router.post("/logout", summary="Invalidate current session")
@limiter.limit(LIMIT_LOGOUT)
async def logout(request: Request, response: Response, db: DBSession, current_user: CurrentUser):
    session_id = get_session_id_from_request(request)
    if session_id:
        await revoke_session(db, session_id)
        await log_logout(db, request, user_id=current_user.id, session_id=session_id)
    clear_session_cookie(response)
    await db.commit()
    return success(message="Logged out successfully")


@router.delete("/me", summary="Permanently delete or deactivate user account")
@limiter.limit(LIMIT_LOGOUT)
async def delete_account(
    request: Request,
    response: Response,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Deactivates user account, revokes all active sessions, unlinks devices, and clears cookie.
    Under compliance policies, account is marked deactivated with timestamp.
    """
    from app.models.device import Device

    # 1. Soft-delete / deactivate user
    current_user.is_active = False
    current_user.deactivated_at = datetime.now(timezone.utc)
    current_user.deactivation_reason = "User requested account deletion"

    # 2. Revoke all active sessions for this user
    await db.execute(
        delete(Session).where(Session.user_id == current_user.id)
    )

    # 3. Delete registered devices
    await db.execute(
        delete(Device).where(Device.user_id == current_user.id)
    )

    clear_session_cookie(response)
    await db.commit()

    return success(message="Account successfully deleted")