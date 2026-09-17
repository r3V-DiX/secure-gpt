import asyncio
import hashlib
import logging
import random
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete

from app.core.config import settings
from app.core.dependencies import DBSession
from app.core.exceptions import BadRequest, Forbidden
from app.core.ratelimit import LIMIT_AUTH, limiter
from app.core.response import success
from app.models.otp_code import OTPCode
from app.models.session import Session
from app.models.user import User, UserRole
from app.models.org import Organisation, OrgStatus
from app.models.org_invitation import OrgInvitation, InvitationStatus
from app.services.auth_event_service import log_login_success
from app.services.auth_service import get_user_by_email
from app.services.email_service import send_otp_email
from app.services.org_service import extract_domain_from_email, is_public_domain, generate_dns_txt_token
from app.services.session_service import SESSION_COOKIE_NAME, SESSION_TTL_SECONDS

router = APIRouter()
logger = logging.getLogger(__name__)


class OTPRequest(BaseModel):
    email: EmailStr
    role_type: str | None = "user"  # "employer", "employee", "user"
    invite_token: str | None = None


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    code: str
    role_type: str | None = "user"
    invite_token: str | None = None
    force_personal: bool | None = False


@router.post("/otp/request", summary="Request 6-digit OTP code to email")
@limiter.limit(LIMIT_AUTH)
async def request_otp(request: Request, body: OTPRequest, db: DBSession):
    email_clean = body.email.strip().lower()
    domain = extract_domain_from_email(email_clean)

    # ── Check Domain Verification & Registration Status ────────────────────────
    if domain and not is_public_domain(domain):
        res = await db.execute(select(Organisation).where(Organisation.domain == domain))
        org = res.scalar_one_or_none()

        # Check existing user
        user = await get_user_by_email(db, email_clean)

        if org and org.status == OrgStatus.ACTIVE:
            # Domain is verified & active. Gated signup check if user doesn't already exist.
            if not user:
                # Check for valid invite
                inv_res = await db.execute(
                    select(OrgInvitation).where(
                        OrgInvitation.org_id == org.id,
                        OrgInvitation.email == email_clean,
                        OrgInvitation.status == InvitationStatus.PENDING
                    )
                )
                invite = inv_res.scalar_one_or_none()
                if not invite and not body.invite_token:
                    raise Forbidden(
                        f"Registration for '@{domain}' is restricted. You need an invitation from your organization administrator to create an account."
                    )

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

    # Dispatch email sending in background task so response returns immediately without hanging
    asyncio.create_task(send_otp_email(email_clean, otp_val))
    await db.commit()

    is_dev = not settings.is_production
    logger.info(f"[OTP REQUEST] Verification code for {email_clean}: {otp_val}")

    return success(
        message=f"6-digit verification code has been dispatched to {email_clean}.",
        data={"email": email_clean}
    )


@router.post("/otp/verify", summary="Verify OTP code and create session")
@limiter.limit(LIMIT_AUTH)
async def verify_otp(request: Request, response: Response, body: OTPVerifyRequest, db: DBSession):
    email_clean = body.email.strip().lower()
    code_clean = body.code.strip()
    domain = extract_domain_from_email(email_clean)

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

    # Fetch existing user or handle new user creation
    user = await get_user_by_email(db, email_clean)
    created_org_onboarding = False

    if not user:
        # Check Organization status for domain
        org = None
        if domain and not is_public_domain(domain):
            org_res = await db.execute(select(Organisation).where(Organisation.domain == domain))
            org = org_res.scalar_one_or_none()

        if org and org.status == OrgStatus.PENDING_VERIFICATION:
            # Org exists but domain DNS is not yet verified
            if not body.force_personal and body.role_type != "employer":
                # Prompt user to choose between personal account or waiting
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "requires_domain_choice": True,
                        "org_name": org.name,
                        "domain": domain,
                        "message": f"Organization '{org.name}' ({domain}) is currently pending DNS verification by its administrator. You can proceed with a Personal Account or wait."
                    }
                )

        # 1. Employer signup with custom domain & no existing org -> Auto-provision Org
        if body.role_type == "employer" and domain and not is_public_domain(domain) and not org:
            org_name = f"{domain.split('.')[0].capitalize()} Enterprise"
            org = Organisation(
                name=org_name,
                domain=domain,
                admin_email=email_clean,
                status=OrgStatus.PENDING_VERIFICATION,
                dns_txt_token=generate_dns_txt_token(),
                plan="enterprise",
                is_active=True,
            )
            db.add(org)
            await db.flush()
            await db.refresh(org)

            user = User(
                email=email_clean,
                full_name=email_clean.split("@")[0].replace(".", " ").title(),
                role=UserRole.ORG_ADMIN,
                org_id=org.id,
                is_active=True,
                privacy_accepted=True,
            )
            db.add(user)
            await db.flush()
            created_org_onboarding = True

        # 2. Existing verified Org with Invitation
        elif org and org.status == OrgStatus.ACTIVE:
            inv_query = select(OrgInvitation).where(
                OrgInvitation.org_id == org.id,
                OrgInvitation.email == email_clean,
                OrgInvitation.status == InvitationStatus.PENDING
            )
            if body.invite_token:
                inv_query = inv_query.where(OrgInvitation.token == body.invite_token)
            
            inv_res = await db.execute(inv_query)
            invite = inv_res.scalar_one_or_none()

            assigned_role = UserRole.EMPLOYEE
            dept_id = None
            if invite:
                if invite.role == "org_admin" or invite.role == "employer":
                    assigned_role = UserRole.ORG_ADMIN
                dept_id = invite.department_id
                invite.status = InvitationStatus.ACCEPTED
                invite.accepted_at = datetime.now(timezone.utc)

            user = User(
                email=email_clean,
                full_name=email_clean.split("@")[0].replace(".", " ").title(),
                role=assigned_role,
                org_id=org.id,
                department_id=dept_id,
                is_active=True,
                privacy_accepted=True,
            )
            db.add(user)
            await db.flush()

        # 3. Default fallback (Personal User or unverified domain user in personal mode)
        else:
            user = User(
                email=email_clean,
                full_name=email_clean.split("@")[0].replace(".", " ").title(),
                role=UserRole.USER,
                org_id=org.id if (org and org.status == OrgStatus.PENDING_VERIFICATION and body.role_type == "employer") else None,
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

    role_val = user.role.value if hasattr(user.role, "value") else str(user.role).lower()
    
    # Determine next routing path
    redirect_url = "/dashboard"
    if created_org_onboarding or (role_val == "org_admin" and user.org_id):
        # Check org status
        org_check = await db.execute(select(Organisation).where(Organisation.id == user.org_id))
        org_obj = org_check.scalar_one_or_none()
        if org_obj and org_obj.status == OrgStatus.PENDING_VERIFICATION:
            redirect_url = "/onboarding"

    resp = JSONResponse(
        content={
            "success": True,
            "data": {
                "id": user.id,
                "email": user.email,
                "role": role_val,
                "org_id": user.org_id,
                "redirect_url": redirect_url,
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
