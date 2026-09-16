import hashlib
import random
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete

from app.core.config import settings
from app.core.dependencies import DBSession
from app.core.exceptions import BadRequest
from app.core.ratelimit import LIMIT_AUTH, limiter
from app.core.response import success
from app.models.otp_code import OTPCode
from app.models.session import Session
from app.models.user import User, UserRole
from app.services.auth_event_service import log_login_success
from app.services.auth_service import get_user_by_email
from app.services.email_service import send_otp_email
from app.services.session_service import SESSION_COOKIE_NAME, SESSION_TTL_SECONDS

router = APIRouter()


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
                "role": user.role.value if hasattr(user.role, "value") else str(user.role).lower(),
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
