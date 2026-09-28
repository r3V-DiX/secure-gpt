"""
Helper services and handlers for Organization registration and invites.
"""
import asyncio
import secrets
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update
from app.models.org import Organisation, OrgStatus
from app.models.org_invitation import OrgInvitation, InvitationStatus
from app.models.user import User, UserRole
from app.models.policy import Policy
from app.services.org_service import generate_dns_txt_token
from app.services.email_notifications import send_employee_invitation_email
from app.core.response import success


async def handle_pending_org_resume(existing_org, body, db):
    """Resume registration for an existing pending organization."""
    if body.name and body.name.strip():
        existing_org.name = body.name.strip()
    existing_org.admin_email = body.admin_email.strip().lower()
    if not existing_org.dns_txt_token:
        existing_org.dns_txt_token = generate_dns_txt_token()

    user_res = await db.execute(select(User).where(User.email == existing_org.admin_email))
    admin_user = user_res.scalar_one_or_none()
    if admin_user:
        admin_user.org_id = existing_org.id
        admin_user.role = UserRole.ORG_ADMIN
        await db.execute(
            update(Policy).where(Policy.user_id == admin_user.id).values(is_disabled_by_org=True)
        )
    await db.commit()
    await db.refresh(existing_org)

    return success(
        data={
            "org_id": existing_org.id,
            "name": existing_org.name,
            "domain": existing_org.domain,
            "admin_email": existing_org.admin_email,
            "status": existing_org.status,
            "dns_txt_token": existing_org.dns_txt_token,
            "dns_verification_instructions": {
                "record_type": "TXT",
                "host": existing_org.domain,
                "value": existing_org.dns_txt_token,
            },
            "created_at": existing_org.created_at.isoformat(),
        },
        message="Organization registration resumed. Please add the DNS TXT challenge record to verify domain ownership.",
    )


async def create_unregistered_invitation(org, body, current_user, db):
    """Create OrgInvitation token and dispatch email for unregistered user."""
    token = secrets.token_urlsafe(32)
    invitation = OrgInvitation(
        org_id=org.id,
        email=body.email.strip().lower(),
        role=body.role or "employee",
        department_id=body.department_id,
        token=token,
        status=InvitationStatus.PENDING,
        invited_by=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.commit()

    asyncio.create_task(
        send_employee_invitation_email(
            to_email=invitation.email,
            org_name=org.name,
            inviter_name=current_user.email,
            invite_url=f"/login?invite={token}",
            role=body.role or "employee",
        )
    )

    return success(
        data={
            "email": body.email.lower(),
            "status": "invitation_created",
            "org_id": org.id,
            "token": token,
            "invite_url": f"/login?invite={token}",
        },
        message=f"Invitation created and dispatched for '{body.email}'. User will be bound to {org.name} upon signing up.",
    )
