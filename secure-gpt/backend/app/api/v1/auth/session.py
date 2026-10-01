import secrets
from urllib.parse import parse_qs
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete

from app.core.config import settings
from app.core.dependencies import CurrentUser, DBSession
from app.core.exceptions import BadRequest, Forbidden
from app.core.ratelimit import LIMIT_AUTH_ME, LIMIT_LOGOUT, limiter
from app.core.response import success
from app.models.device import Device
from app.models.org import Organisation
from app.models.session import Session
from app.models.user import User, UserRole
from app.services.auth_event_service import log_login_success, log_logout
from app.services.auth_service import get_user_by_email
from app.services.org_service import extract_domain_from_email, is_public_domain
from app.services.rbac_service import get_user_permissions, get_user_roles
from app.services.session_service import (
    SESSION_COOKIE_NAME,
    SESSION_TTL_SECONDS,
    IMPERSONATION_TTL_SECONDS,
    clear_session_cookie,
    create_impersonation_session,
    get_session_id_from_request,
    get_session,
    redeem_impersonation_handoff,
    revoke_session,
    set_session_cookie,
    validate_session,
)

router = APIRouter()


class DevLoginRequest(BaseModel):
    email: EmailStr
    persona: str = "employer"  # "employer" | "employee" | "user"


@router.post("/dev-login", summary="Bypass authentication with Persona selection")
async def dev_login(request: Request, body: DevLoginRequest, db: DBSession):
    if settings.app_env != "development":
        raise Forbidden("Developer login is only available in development environment")

    email_clean = body.email.strip().lower()
    user = await get_user_by_email(db, email_clean)

    role_map = {
        "super_admin": UserRole.SUPER_ADMIN,
        "employer": UserRole.ORG_ADMIN,
        "employee": UserRole.EMPLOYEE,
        "user": UserRole.USER,
    }
    requested_role = role_map.get(body.persona.lower(), UserRole.USER)

    is_super = (
        body.persona.lower() == "super_admin"
        or email_clean in ("admin@superadmin.com", "superadmin@blackvector.online")
        or "superadmin" in email_clean
    )
    if not user:
        user = User(
            email=email_clean,
            full_name=email_clean.split("@")[0].title(),
            role=UserRole.SUPER_ADMIN if is_super else requested_role,
            is_active=True,
            privacy_accepted=True,
        )
        db.add(user)
        await db.flush()
    elif is_super:
        # Elevate to SUPER_ADMIN if explicitly using the super_admin dev bypass or email
        user.role = UserRole.SUPER_ADMIN
        user.is_active = True
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

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role).lower()
    resp = JSONResponse(content={"ok": True, "message": f"Logged in as {user.email} ({role_str})"})
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


@router.get("/me", summary="Get current authenticated user")
@limiter.limit(LIMIT_AUTH_ME)
async def get_me(request: Request, current_user: CurrentUser, db: DBSession):
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

    is_impersonation = getattr(request.state, "is_impersonation", False)
    impersonator_id = getattr(request.state, "impersonator_id", None)
    impersonated_org = None
    if is_impersonation and current_user.org_id:
        org_res = await db.execute(select(Organisation).where(Organisation.id == current_user.org_id))
        org_obj = org_res.scalar_one_or_none()
        if org_obj:
            impersonated_org = {
                "id": org_obj.id,
                "name": org_obj.name,
                "domain": org_obj.domain,
            }

    return success(
        data={
            "id": current_user.id,
            "email": current_user.email,
            "fullName": current_user.full_name,
            "avatarUrl": current_user.avatar_url,
            "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).lower(),
            "isActive": current_user.is_active,
            "orgId": current_user.org_id,
            "departmentId": current_user.department_id,
            "createdAt": current_user.created_at.isoformat(),
            "lastLoginAt": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
            "deactivatedAt": current_user.deactivated_at.isoformat() if current_user.deactivated_at else None,
            "deactivationReason": current_user.deactivation_reason,
            "roles": [r.slug for r in roles],
            "permissions": list(permissions),
            "is_impersonation": is_impersonation,
            "impersonator_id": impersonator_id,
            "impersonated_org": impersonated_org,
        },
        message="User fetched successfully",
    )


@router.post("/impersonate/redeem", summary="Redeem a one-use tenant impersonation handoff")
async def redeem_impersonation(request: Request, db: DBSession):
    if settings.portal_mode != "standard":
        raise Forbidden("Handoffs can only be redeemed on the user dashboard")
    if request.headers.get("content-type", "").split(";", 1)[0] != "application/x-www-form-urlencoded":
        raise BadRequest("Expected a form submission")
    body = await request.body()
    if len(body) > 4096:
        raise BadRequest("Handoff request is too large")
    ticket = parse_qs(body.decode("utf-8"), keep_blank_values=True).get("ticket", [""])[0]
    if not ticket:
        raise BadRequest("Missing impersonation handoff")

    target_id, impersonator_id = await redeem_impersonation_handoff(db, ticket)
    previous_id = get_session_id_from_request(request)
    if previous_id:
        # A top-level form POST has no X-Client-Fingerprint header. Inspect the
        # prior session here; validate its fingerprint when restoring on exit.
        previous = await get_session(db, previous_id)
        if previous is None or not previous.is_valid or previous.is_impersonation or not previous.user.is_active:
            previous_id = None

    session = await create_impersonation_session(
        db, target_user_id=target_id, impersonator_id=impersonator_id,
        previous_session_id=previous_id,
    )
    await db.commit()
    response = RedirectResponse(url="/dashboard", status_code=303)
    set_session_cookie(response, session.id, IMPERSONATION_TTL_SECONDS)
    return response


@router.post("/impersonate/exit", summary="Exit tenant impersonation and restore the previous session")
async def exit_impersonation(request: Request, response: Response, db: DBSession, current_user: CurrentUser):
    if not request.state.is_impersonation:
        raise Forbidden("No impersonation session is active")
    session_id = get_session_id_from_request(request)
    session = await get_session(db, session_id)
    await revoke_session(db, session_id)
    previous_id = session.previous_session_id if session else None
    previous = None
    if previous_id:
        previous, error = await validate_session(db, request, previous_id)
        if error or previous is None or previous.is_impersonation or not previous.user.is_active:
            previous = None
    if previous:
        remaining = max(1, int((previous.expires_at - datetime.now(timezone.utc)).total_seconds()))
        set_session_cookie(response, previous.id, remaining)
    else:
        clear_session_cookie(response)
    await db.commit()
    return success(
        data={"redirect_url": "/organizations"},
        message="Exited impersonation mode successfully"
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
