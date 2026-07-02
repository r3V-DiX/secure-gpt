# backend/app/api/v1/auth.py
#
# FIX: google_callback no longer redirects directly to the frontend.
# It returns a 200 response with set-cookie so the Next.js BFF proxy
# (route.ts) can intercept it, re-plant the cookie on localhost:3000,
# and then redirect the browser to /callback.
#
# Previously the backend was sending a 302 directly to localhost:3000/callback
# with set-cookie — the browser followed that redirect and the cookie got
# attributed to localhost:8000, NOT localhost:3000. Middleware never saw it.

import logging
import secrets
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse

from app.core.config import settings
from app.core.dependencies import DBSession, CurrentUser
from app.core.exceptions import OAuthFailed, UserInactive
from app.core.response import success
from app.core.ratelimit import limiter, LIMIT_AUTH, LIMIT_AUTH_ME, LIMIT_LOGOUT
from app.core.fingerprint import compute_fingerprint
from app.models.session import Session
from app.services.auth_service import upsert_google_user
from app.services.session_service import (
    revoke_session,
    get_session_id_from_request,
    clear_session_cookie,
    SESSION_COOKIE_NAME,
    SESSION_TTL_SECONDS,
)
from app.services.auth_event_service import (
    log_login_success,
    log_login_failed,
    log_logout,
    log_oauth_failed,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

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
    logger.info("=== CALLBACK HIT ===")
    logger.info("  host header : %s", request.headers.get("host", "MISSING"))
    logger.info("  full url    : %s", str(request.url))
    logger.info("  code present: %s", bool(code))
    logger.info("  error       : %s", error)

    is_oauth_callback = request.headers.get("x-oauth-callback") == "true"
    frontend_url = settings.allowed_origins_list[0]  # http://localhost:3000

    if error or not code:
        await log_oauth_failed(db, request, reason=error or "missing_code")
        # If proxied via BFF, return error JSON; else redirect
        if is_oauth_callback:
            return JSONResponse(status_code=400, content={"error": "oauth_failed"})
        return RedirectResponse(url=f"{frontend_url}/login?error=oauth_failed", status_code=302)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
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
                await log_oauth_failed(db, request, reason="token_exchange_failed")
                raise OAuthFailed("Failed to exchange authorization code with Google")

            tokens = token_resp.json()
            access_token = tokens.get("access_token")
            if not access_token:
                await log_oauth_failed(db, request, reason="no_access_token")
                raise OAuthFailed("No access token returned from Google")

            userinfo_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_resp.status_code != 200:
                await log_oauth_failed(db, request, reason="userinfo_fetch_failed")
                raise OAuthFailed("Failed to fetch user profile from Google")

            profile = userinfo_resp.json()

    except OAuthFailed:
        raise
    except Exception as exc:
        await log_oauth_failed(db, request, reason=str(exc))
        raise OAuthFailed("Google OAuth request failed")

    user = await upsert_google_user(
        db,
        google_id=profile["sub"],
        email=profile["email"],
        full_name=profile.get("name", ""),
        avatar_url=profile.get("picture"),
    )

    if not user.is_active:
        if user.deactivated_at and (datetime.now(timezone.utc) - user.deactivated_at).days <= 45:
            pass
        else:
            await log_login_failed(db, request, reason="user_inactive", email=user.email)
            raise UserInactive()

    # Create session
    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL_SECONDS)

    # Fingerprint is unbound when proxied via BFF (no real browser headers available)
    fingerprint_hash = None if is_oauth_callback else compute_fingerprint(request)

    session = Session(
        id=session_id,
        user_id=user.id,
        fingerprint_hash=fingerprint_hash,
        user_agent=request.headers.get("user-agent"),
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()

    logger.info("Session created — fingerprint %s", "unbound" if not fingerprint_hash else "bound")

    is_prod = settings.is_production

    logger.info("=== SETTING COOKIE ===")
    logger.info("  session_id : %s...", session_id[:8])
    logger.info("  secure     : %s", is_prod)
    logger.info("  proxied    : %s", is_oauth_callback)

    await log_login_success(db, request, user_id=user.id, session_id=session.id)
    await db.commit()

    if is_oauth_callback:
        # ── BFF proxy path ────────────────────────────────────────────────────
        # Return 200 + set-cookie so the Next.js proxy (route.ts) can
        # intercept the cookie and re-plant it on localhost:3000.
        # The proxy then redirects the browser to /callback.
        json_response = JSONResponse(
            status_code=200,
            content={"ok": True},
        )
        json_response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_id,
            max_age=SESSION_TTL_SECONDS,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            path="/",
        )
        logger.info("CALLBACK DONE (BFF) — returning 200 with set-cookie")
        return json_response
    else:
        # ── Direct browser path (non-proxied) ────────────────────────────────
        # Redirect directly to frontend with cookie set on the response.
        redirect_response = RedirectResponse(
            url=f"{frontend_url}/callback",
            status_code=302,
        )
        redirect_response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_id,
            max_age=SESSION_TTL_SECONDS,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            path="/",
        )
        logger.info("CALLBACK DONE (direct) — redirecting to: %s/callback", frontend_url)
        return redirect_response


@router.get("/me", summary="Get current authenticated user")
@limiter.limit(LIMIT_AUTH_ME)
async def get_me(request: Request, current_user: CurrentUser, db: DBSession):
    from app.services.rbac_service import get_user_roles, get_user_permissions
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


@router.delete("/me", summary="Delete user account")
async def delete_me(request: Request, response: Response, db: DBSession, current_user: CurrentUser):
    current_user.is_active = False
    current_user.deactivated_at = datetime.now(timezone.utc)
    current_user.deactivation_reason = "deletion"
    current_user.pre_deletion_email_sent = False
    
    # Revoke all active sessions for this user except the current request's session cookie
    # (actually we clear the cookie, so we can revoke all sessions in DB)
    from sqlalchemy import update
    from app.models.session import Session
    await db.execute(
        update(Session)
        .where(Session.user_id == current_user.id)
        .values(is_revoked=True)
    )
    
    # Send deactivation confirmation email
    from app.services.email_service import send_deactivation_email
    import asyncio
    asyncio.create_task(send_deactivation_email(current_user.email))
    
    await db.commit()
    clear_session_cookie(response)
    return success(message="Account deactivated. You have 45 days to reactivate it by signing in.")


@router.post("/restore", summary="Reactivate deactivated account")
async def restore_me(request: Request, db: DBSession, current_user: CurrentUser):
    current_user.is_active = True
    current_user.deactivated_at = None
    current_user.deactivation_reason = None
    current_user.pre_deletion_email_sent = False
    await db.commit()
    return success(message="Account successfully reactivated!")


from pydantic import BaseModel


class DevLoginRequest(BaseModel):
    email: str



@router.post("/dev-login", summary="Bypass authentication in development")
async def dev_login(
    request: Request,
    body: DevLoginRequest,
    db: DBSession,
):
    from app.core.exceptions import Forbidden
    if settings.app_env != "development":
        raise Forbidden("Developer login is only available in development environment")

    from app.services.auth_service import get_user_by_email
    user = await get_user_by_email(db, body.email)
    if not user:
        # Create user automatically for convenience in local testing
        from app.models.user import User, UserRole
        email_lower = body.email.lower()
        
        # Determine roles based on email prefix/keyword
        if "security" in email_lower or "sec" in email_lower:
            legacy_role = UserRole.USER # map to legacy user or custom
            role_slug = "security_admin"
        elif "super" in email_lower or "admin" in email_lower:
            legacy_role = UserRole.SUPER_ADMIN
            role_slug = "super_admin"
        elif "audit" in email_lower:
            legacy_role = UserRole.AUDITOR
            role_slug = "auditor"
        else:
            legacy_role = UserRole.USER
            role_slug = "user"

        user = User(
            email=email_lower,
            full_name=body.email.split("@")[0].title(),
            role=legacy_role,
            is_active=True,
            privacy_accepted=True
        )
        db.add(user)
        await db.flush()

        # Seed standard role assignment
        from sqlalchemy import select
        from app.models.rbac import Role, UserRoleAssignment
        role_res = await db.execute(select(Role).where(Role.slug == role_slug))
        role = role_res.scalar_one_or_none()
        if role:
            assignment = UserRoleAssignment(user_id=user.id, role_id=role.id, is_active=True)
            db.add(assignment)
        await db.flush()



    if not user.is_active:
        if user.deactivated_at and (datetime.now(timezone.utc) - user.deactivated_at).days <= 45:
            pass
        else:
            raise UserInactive()

    # Create session
    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL_SECONDS)

    session = Session(
        id=session_id,
        user_id=user.id,
        fingerprint_hash=None,  # Unbound session for convenience
        user_agent=request.headers.get("user-agent"),
        expires_at=expires_at,
    )
    db.add(session)
    await log_login_success(db, request, user_id=user.id, session_id=session.id)
    await db.commit()

    response = JSONResponse(content={"ok": True, "message": f"Logged in as {user.email}"})
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
    return response


from pydantic import BaseModel

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    code: str


@router.post("/otp/request", summary="Request OTP for admin login")
async def request_otp(
    request: Request,
    body: OTPRequest,
    db: DBSession,
):
    from app.services.auth_service import get_user_by_email
    from app.models.otp_code import OTPCode
    from app.services.email_service import send_otp_email
    from app.core.exceptions import Forbidden
    from sqlalchemy import select, delete
    import random
    import hashlib

    email_lower = body.email.strip().lower()
    
    # 1. Fetch user by email
    user = await get_user_by_email(db, email_lower)
    if not user:
        raise Forbidden("Access denied. Admin account not found.")

    # 2. Check if user is admin (role is super_admin or security_admin)
    from app.models.user import UserRole
    is_admin = False
    if user.role in (UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN):
        is_admin = True
    else:
        # Check dynamic roles
        from app.models.rbac import UserRoleAssignment, Role
        res = await db.execute(
            select(Role)
            .join(UserRoleAssignment, UserRoleAssignment.role_id == Role.id)
            .where(UserRoleAssignment.user_id == user.id, UserRoleAssignment.is_active == True)
        )
        roles = res.scalars().all()
        if any(r.slug in ("super_admin", "security_admin") for r in roles):
            is_admin = True

    if not is_admin:
        raise Forbidden("Access denied. Admin privileges required.")

    # 3. Generate a 6-digit OTP
    otp_val = f"{random.randint(100000, 999999)}"
    hashed_otp = hashlib.sha256(otp_val.encode()).hexdigest()

    # 4. Expiry time (10 minutes)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # 5. Delete existing active/expired OTPs for this email to prevent spam
    await db.execute(delete(OTPCode).where(OTPCode.email == email_lower))

    # 6. Save new OTP to database
    otp_code_obj = OTPCode(
        email=email_lower,
        code=hashed_otp,
        attempts=0,
        expires_at=expires_at,
    )
    db.add(otp_code_obj)
    await db.flush()

    # 7. Send email
    await send_otp_email(email_lower, otp_val)

    await db.commit()
    return success(message="Verification code sent to your email.")


@router.post("/otp/verify", summary="Verify OTP and log in")
async def verify_otp(
    request: Request,
    response: Response,
    body: OTPVerify,
    db: DBSession,
):
    from app.services.auth_service import get_user_by_email
    from app.models.otp_code import OTPCode
    from app.core.exceptions import Forbidden
    from sqlalchemy import select
    import hashlib

    email_lower = body.email.strip().lower()
    
    # 1. Fetch user by email
    user = await get_user_by_email(db, email_lower)
    if not user:
        raise Forbidden("Access denied. Admin account not found.")

    if not user.is_active:
        if user.deactivated_at and (datetime.now(timezone.utc) - user.deactivated_at).days <= 45:
            pass
        else:
            raise UserInactive()

    # 2. Fetch OTP record
    res = await db.execute(
        select(OTPCode)
        .where(OTPCode.email == email_lower, OTPCode.used_at == None)
        .order_by(OTPCode.created_at.desc())
    )
    otp_record = res.scalar_one_or_none()

    if not otp_record:
        raise Forbidden("Invalid or expired verification code.")

    # 3. Check if expired
    if datetime.now(timezone.utc) > otp_record.expires_at:
        await db.delete(otp_record)
        await db.commit()
        raise Forbidden("Verification code has expired. Please request a new one.")

    # 4. Check max attempts (3)
    if otp_record.attempts >= 3:
        await db.delete(otp_record)
        await db.commit()
        raise Forbidden("Too many failed attempts. Please request a new verification code.")

    # 5. Check if valid
    hashed_input = hashlib.sha256(body.code.strip().encode()).hexdigest()
    if hashed_input != otp_record.code:
        otp_record.attempts += 1
        await db.commit()
        raise Forbidden("Invalid verification code.")

    # 6. Mark OTP as used
    otp_record.used_at = datetime.now(timezone.utc)
    
    # 7. Create session
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

    # Create response and set cookie
    response = JSONResponse(content={"success": True, "data": {
        "id": user.id,
        "email": user.email,
        "fullName": user.full_name,
        "avatarUrl": user.avatar_url,
        "role": user.role.value,
        "deactivatedAt": user.deactivated_at.isoformat() if user.deactivated_at else None,
        "deactivationReason": user.deactivation_reason,
    }, "message": f"Logged in as {user.email}"})

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
    return response