# backend/app/api/v1/orgs.py
# ─────────────────────────────────────────────────────────────────────────────
# Enterprise Organization Management & Department Endpoints
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timezone
import copy
from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy import select, func, update

from app.core.dependencies import CurrentUser, DBSession, has_permission, require_roles
from app.core.response import success, error
from app.core.ratelimit import limiter, LIMIT_AUTH
from app.core.exceptions import BadRequest, NotFound, Forbidden

from app.models.org import Organisation, OrgStatus
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.policy import Policy

from app.schemas.org_schema import (
    OrgRegisterRequest,
    OrgVerifyDomainRequest,
    OrgInviteUserRequest,
    DepartmentCreateRequest,
)
from app.services.org_service import (
    is_public_domain,
    extract_domain_from_email,
    generate_dns_txt_token,
)

router = APIRouter(prefix="/orgs", tags=["organisations"])


# ── 1. Organization Registration & Verification ──────────────────────────────

@router.post("/register", summary="Register a new Enterprise Organization", status_code=201)
@limiter.limit(LIMIT_AUTH)
async def register_organisation(request: Request, body: OrgRegisterRequest, db: DBSession):
    """
    Register a new Organization with custom corporate domain.
    Public email providers (Gmail, Yahoo, etc.) are blocked.
    """
    domain = extract_domain_from_email(body.admin_email)
    if not domain or is_public_domain(domain):
        raise BadRequest(
            message="Organizations must be registered using a custom corporate email domain. Public email providers (gmail.com, yahoo.com, outlook.com, etc.) are strictly blocked."
        )

    # Check if domain already registered
    existing_org = await db.execute(select(Organisation).where(Organisation.domain == domain))
    if existing_org.scalar_one_or_none():
        raise BadRequest(message=f"An organization is already registered for domain '{domain}'.")

    dns_token = generate_dns_txt_token()

    new_org = Organisation(
        name=body.name.strip(),
        domain=domain,
        admin_email=body.admin_email.strip().lower(),
        status=OrgStatus.PENDING_VERIFICATION,
        dns_txt_token=dns_token,
        plan="enterprise",
        is_active=True,
    )
    db.add(new_org)
    await db.flush()
    await db.refresh(new_org)

    # Check if admin user already exists
    user_res = await db.execute(select(User).where(User.email == new_org.admin_email))
    admin_user = user_res.scalar_one_or_none()
    if admin_user:
        admin_user.org_id = new_org.id
        admin_user.role = UserRole.ORG_ADMIN
        # Disable personal policies in favor of org policies
        await db.execute(
            update(Policy)
            .where(Policy.user_id == admin_user.id)
            .values(is_disabled_by_org=True)
        )
    await db.commit()

    return success(
        data={
            "org_id": new_org.id,
            "name": new_org.name,
            "domain": new_org.domain,
            "admin_email": new_org.admin_email,
            "status": new_org.status,
            "dns_txt_token": new_org.dns_txt_token,
            "dns_verification_instructions": {
                "record_type": "TXT",
                "host": new_org.domain,
                "value": new_org.dns_txt_token,
            },
            "created_at": new_org.created_at.isoformat(),
        },
        message="Organization registered successfully. Please add the DNS TXT challenge record to verify domain ownership.",
    )


@router.post("/verify-domain", summary="Verify DNS TXT record for Organization")
async def verify_domain(body: OrgVerifyDomainRequest, db: DBSession, current_user: CurrentUser):
    """
    Verify ownership of the custom corporate domain.
    Queries DNS for the challenge TXT token.
    Flips organization status to ACTIVE upon match.
    """
    res = await db.execute(select(Organisation).where(Organisation.id == body.org_id))
    org = res.scalar_one_or_none()
    if not org:
        raise NotFound("Organization not found")

    from app.services.org_service import verify_dns_txt_record, migrate_domain_personal_users_to_employees
    
    is_valid = await verify_dns_txt_record(org.domain, org.dns_txt_token)
    if not is_valid:
        raise BadRequest(
            message=f"DNS verification challenge failed. Could not find TXT record containing '{org.dns_txt_token}' on domain '{org.domain}'. DNS propagation can take 1-2 minutes."
        )

    org.status = OrgStatus.ACTIVE
    org.domain_verified_at = datetime.now(timezone.utc)
    
    # Auto-migrate all personal accounts under this domain into employees
    migrated_count = await migrate_domain_personal_users_to_employees(db, org.id, org.domain)
    await db.commit()

    return success(
        data={
            "org_id": org.id,
            "domain": org.domain,
            "status": org.status,
            "verified_at": org.domain_verified_at.isoformat(),
            "migrated_users_count": migrated_count,
        },
        message=f"Domain ownership successfully verified! Organization is now ACTIVE. {migrated_count} existing domain users were migrated to employee accounts.",
    )


@router.get("/current", summary="Get current user's Organization details")
async def get_current_org(db: DBSession, current_user: CurrentUser):
    org = None
    if current_user.org_id:
        res = await db.execute(select(Organisation).where(Organisation.id == current_user.org_id))
        org = res.scalar_one_or_none()
    
    if not org:
        user_domain = extract_domain_from_email(current_user.email)
        if user_domain and not is_public_domain(user_domain):
            res = await db.execute(select(Organisation).where(Organisation.domain == user_domain))
            org = res.scalar_one_or_none()
            if org:
                # Auto-link user to org
                current_user.org_id = org.id
                await db.commit()

    if not org:
        return success(data=None, message="User does not belong to an organization")

    return success(
        data={
            "id": org.id,
            "name": org.name,
            "domain": org.domain,
            "admin_email": org.admin_email,
            "status": org.status,
            "dns_txt_token": org.dns_txt_token,
            "domain_verified_at": org.domain_verified_at.isoformat() if org.domain_verified_at else None,
            "created_at": org.created_at.isoformat(),
        },
        message="Organization fetched",
    )


# ── 2. Team Invitation & Auto-Enrollment ──────────────────────────────────────

@router.post("/invite", summary="Invite employee to Organization (Same-Domain only)")
async def invite_user(body: OrgInviteUserRequest, db: DBSession, current_user: CurrentUser):
    """
    Invites or auto-enrolls a user. Enforces same-domain matching with organization.
    """
    if not current_user.org_id:
        user_domain = extract_domain_from_email(current_user.email)
        if user_domain and not is_public_domain(user_domain):
            org_res = await db.execute(select(Organisation).where(Organisation.domain == user_domain))
            org = org_res.scalar_one_or_none()
            if org:
                current_user.org_id = org.id
                await db.commit()

    if not current_user.org_id:
        raise Forbidden("Only members of an active Organization can send invitations.")

    res = await db.execute(select(Organisation).where(Organisation.id == current_user.org_id))
    org = res.scalar_one_or_none()
    if not org:
        raise NotFound("Organization not found")

    # Domain verification gating: Prevent invitations until organization domain ownership is verified
    if org.status != OrgStatus.ACTIVE and not org.domain_verified_at:
        raise BadRequest(
            message=f"Domain verification required: You must verify ownership of '{org.domain}' via DNS TXT challenge before inviting team members."
        )

    user_domain = extract_domain_from_email(body.email)
    if user_domain != org.domain:
        raise BadRequest(
            message=f"Cannot invite users from external domains. Invited email must match the organization domain '@{org.domain}'."
        )

    # Check if user already exists in SecureGPT
    user_res = await db.execute(select(User).where(User.email == body.email.strip().lower()))
    target_user = user_res.scalar_one_or_none()

    if target_user:
        # Auto-enroll existing user
        target_user.org_id = org.id
        if body.department_id:
            target_user.department_id = body.department_id
        target_user.role = UserRole.EMPLOYEE
        
        # Safely disable personal policies
        await db.execute(
            update(Policy)
            .where(Policy.user_id == target_user.id)
            .values(is_disabled_by_org=True)
        )
        await db.flush()

        return success(
            data={
                "email": target_user.email,
                "status": "auto_enrolled",
                "org_id": org.id,
                "department_id": target_user.department_id,
            },
            message=f"Existing user '{target_user.email}' was automatically enrolled into {org.name}.",
        )
    else:
        # Create OrgInvitation record for unregistered user
        from app.models.org_invitation import OrgInvitation, InvitationStatus
        from datetime import timedelta
        import secrets

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


# ── 3. Department Management (Tier 3) ─────────────────────────────────────────

@router.post("/departments", summary="Create an Employee Category / Department", status_code=201)
async def create_department(body: DepartmentCreateRequest, db: DBSession, current_user: CurrentUser):
    if not current_user.org_id:
        user_domain = extract_domain_from_email(current_user.email)
        if user_domain and not is_public_domain(user_domain):
            org_res = await db.execute(select(Organisation).where(Organisation.domain == user_domain))
            org = org_res.scalar_one_or_none()
            if not org:
                # Auto-provision pending organization for domain
                org = Organisation(
                    name=f"{user_domain.split('.')[0].capitalize()} Enterprise",
                    domain=user_domain,
                    admin_email=current_user.email,
                    status=OrgStatus.PENDING_VERIFICATION,
                    dns_txt_token=generate_dns_txt_token(),
                    plan="enterprise",
                    is_active=True,
                )
                db.add(org)
                await db.flush()
                await db.refresh(org)
            
            current_user.org_id = org.id
            current_user.role = UserRole.ORG_ADMIN
            await db.flush()

    if not current_user.org_id:
        raise Forbidden("Must be in an organization to create departments.")

    # Domain verification gating: Prevent department/category creation until organization domain ownership is verified
    res = await db.execute(select(Organisation).where(Organisation.id == current_user.org_id))
    org = res.scalar_one_or_none()
    if not org:
        raise NotFound("Organization not found")

    if org.status != OrgStatus.ACTIVE and not org.domain_verified_at:
        raise BadRequest(
            message=f"Domain verification required: You must verify ownership of '{org.domain}' via DNS TXT challenge before creating employee categories or departments."
        )

    dept = Department(
        org_id=current_user.org_id,
        name=body.name.strip(),
        description=body.description,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)

    return success(
        data={
            "id": dept.id,
            "org_id": dept.org_id,
            "name": dept.name,
            "description": dept.description,
            "created_at": dept.created_at.isoformat(),
        },
        message=f"Department '{dept.name}' created successfully.",
    )


@router.get("/departments", summary="List all departments for current Organization")
async def list_departments(db: DBSession, current_user: CurrentUser):
    if not current_user.org_id:
        user_domain = extract_domain_from_email(current_user.email)
        if user_domain and not is_public_domain(user_domain):
            org_res = await db.execute(select(Organisation).where(Organisation.domain == user_domain))
            org = org_res.scalar_one_or_none()
            if org:
                current_user.org_id = org.id
                await db.commit()

    if not current_user.org_id:
        return success(data=[], message="No organization linked.")

    res = await db.execute(
        select(Department).where(Department.org_id == current_user.org_id).order_by(Department.name.asc())
    )
    departments = res.scalars().all()

    dept_data = []
    for d in departments:
        # Count members
        count_res = await db.execute(
            select(func.count()).select_from(User).where(User.department_id == d.id)
        )
        members_count = count_res.scalar_one()
        dept_data.append({
            "id": d.id,
            "org_id": d.org_id,
            "name": d.name,
            "description": d.description,
            "created_at": d.created_at.isoformat(),
            "members_count": members_count,
        })

    return success(data=dept_data, message="Departments fetched")
