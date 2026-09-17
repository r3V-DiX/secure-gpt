# backend/app/api/v1/admin/orgs.py
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Request, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func, or_, delete, update
from sqlalchemy.orm import selectinload

from app.core.dependencies import DBSession, CurrentUser, has_permission, require_roles
from app.core.exceptions import NotFound, BadRequest, Forbidden
from app.core.response import success
from app.models.org import Organisation, OrgStatus
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.rbac import PermissionModule, RiskLevel
from app.services.rbac_service import get_user_roles, log_admin_action
from app.services.org_service import generate_dns_txt_token, extract_domain_from_email

logger = logging.getLogger(__name__)
router = APIRouter(tags=["admin-organizations"])


class AdminOrgCreateRequest(BaseModel):
    name: str
    admin_email: EmailStr
    domain: Optional[str] = None
    plan: str = "enterprise"
    pre_verify: bool = False


class AdminOrgVerifyRequest(BaseModel):
    org_id: str


class AdminOrgStatusRequest(BaseModel):
    status: OrgStatus
    is_active: Optional[bool] = None


@router.get(
    "/orgs",
    summary="List all enterprise organizations with summary telemetry",
    dependencies=[require_roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)]
)
async def list_admin_organizations(
    current_user: CurrentUser,
    db: DBSession,
    search: Optional[str] = Query(None, description="Search by org name or domain"),
    status: Optional[OrgStatus] = Query(None, description="Filter by organization status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    stmt = select(Organisation)

    if search:
        search_filter = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Organisation.name).like(search_filter),
                func.lower(Organisation.domain).like(search_filter),
                func.lower(Organisation.admin_email).like(search_filter)
            )
        )

    if status:
        stmt = stmt.where(Organisation.status == status)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count_res = await db.execute(count_stmt)
    total = total_count_res.scalar_one()

    # Apply pagination and sorting
    stmt = stmt.order_by(Organisation.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(stmt)
    orgs = res.scalars().all()

    org_items = []
    for org in orgs:
        # Aggregated user count
        u_count_res = await db.execute(
            select(
                func.count(User.id).label("total_users"),
                func.count(User.id).filter(User.is_active.is_(True)).label("active_users")
            ).where(User.org_id == org.id)
        )
        u_row = u_count_res.first()
        total_users = u_row[0] if u_row else 0
        active_users = u_row[1] if u_row else 0

        # Department count
        dept_count_res = await db.execute(
            select(func.count(Department.id)).where(Department.org_id == org.id)
        )
        dept_count = dept_count_res.scalar_one()

        org_items.append({
            "id": org.id,
            "name": org.name,
            "domain": org.domain,
            "admin_email": org.admin_email,
            "status": org.status.value if hasattr(org.status, "value") else str(org.status),
            "plan": org.plan,
            "is_active": org.is_active,
            "dns_txt_token": org.dns_txt_token,
            "domain_verified_at": org.domain_verified_at.isoformat() if org.domain_verified_at else None,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "user_count": total_users,
            "active_user_count": active_users,
            "department_count": dept_count,
        })

    return success(
        data={
            "items": org_items,
            "total": total,
            "limit": limit,
            "offset": offset
        },
        message="Organizations fetched successfully"
    )


@router.post(
    "/orgs",
    summary="Create a new organization from Super Admin console",
    dependencies=[require_roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)]
)
async def create_admin_organization(
    body: AdminOrgCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    domain = body.domain
    if not domain:
        domain = extract_domain_from_email(body.admin_email)

    if domain:
        existing = await db.execute(select(Organisation).where(Organisation.domain == domain))
        if existing.scalar_one_or_none():
            raise BadRequest(message=f"An organization is already registered with domain '{domain}'.")

    dns_token = generate_dns_txt_token()
    status = OrgStatus.ACTIVE if body.pre_verify else OrgStatus.PENDING_VERIFICATION
    verified_at = datetime.now(timezone.utc) if body.pre_verify else None

    org = Organisation(
        name=body.name.strip(),
        domain=domain,
        admin_email=body.admin_email.strip().lower(),
        status=status,
        dns_txt_token=dns_token,
        domain_verified_at=verified_at,
        plan=body.plan,
        is_active=True
    )
    db.add(org)
    await db.flush()
    await db.refresh(org)

    # Link admin user if already exists
    user_res = await db.execute(select(User).where(User.email == org.admin_email))
    admin_user = user_res.scalar_one_or_none()
    if admin_user:
        admin_user.org_id = org.id
        admin_user.role = UserRole.ORG_ADMIN

    # Log audit entry
    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="org:create",
        module=PermissionModule.ORGANISATION,
        description=f"Created new organization '{org.name}' ({org.domain})",
        entity_id=org.id,
        entity_type="Organisation",
        entity_name=org.name,
        after_state={"domain": org.domain, "status": org.status.value, "plan": org.plan},
        risk_level=RiskLevel.HIGH
    )

    await db.commit()

    return success(
        data={
            "id": org.id,
            "name": org.name,
            "domain": org.domain,
            "admin_email": org.admin_email,
            "status": org.status.value if hasattr(org.status, "value") else str(org.status),
            "dns_txt_token": org.dns_txt_token,
            "domain_verified_at": org.domain_verified_at.isoformat() if org.domain_verified_at else None,
            "created_at": org.created_at.isoformat() if org.created_at else None,
        },
        message=f"Organization '{org.name}' created successfully."
    )


@router.post(
    "/orgs/verify",
    summary="Super Admin manual domain verification override",
    dependencies=[require_roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)]
)
async def manual_verify_organization(
    body: AdminOrgVerifyRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    res = await db.execute(select(Organisation).where(Organisation.id == body.org_id))
    org = res.scalar_one_or_none()
    if not org:
        raise NotFound("Organization not found")

    old_status = org.status.value if hasattr(org.status, "value") else str(org.status)
    org.status = OrgStatus.ACTIVE
    org.domain_verified_at = datetime.now(timezone.utc)
    org.is_active = True

    from app.services.org_service import migrate_domain_personal_users_to_employees
    migrated_count = await migrate_domain_personal_users_to_employees(db, org.id, org.domain)

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="org:manual_verify",
        module=PermissionModule.ORGANISATION,
        description=f"Super Admin manual domain verification override for '{org.name}' ({org.domain}). Migrated {migrated_count} domain users.",
        entity_id=org.id,
        entity_type="Organisation",
        entity_name=org.name,
        before_state={"status": old_status},
        after_state={"status": "ACTIVE", "domain_verified_at": org.domain_verified_at.isoformat(), "migrated_users": migrated_count},
        risk_level=RiskLevel.HIGH
    )

    await db.commit()

    return success(
        data={
            "id": org.id,
            "name": org.name,
            "domain": org.domain,
            "status": "ACTIVE",
            "domain_verified_at": org.domain_verified_at.isoformat(),
            "migrated_users_count": migrated_count,
        },
        message=f"Organization '{org.name}' domain has been manually verified ({migrated_count} users migrated)."
    )


@router.patch(
    "/orgs/{org_id}/status",
    summary="Update organization status or active state",
    dependencies=[require_roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)]
)
@router.put(
    "/orgs/{org_id}/status",
    summary="Update organization status or active state (alias)",
    dependencies=[require_roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)]
)
async def update_org_status(
    org_id: str,
    body: AdminOrgStatusRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    res = await db.execute(select(Organisation).where(Organisation.id == org_id))
    org = res.scalar_one_or_none()
    if not org:
        raise NotFound("Organization not found")

    old_status = org.status.value if hasattr(org.status, "value") else str(org.status)
    old_active = org.is_active

    org.status = body.status
    if body.is_active is not None:
        org.is_active = body.is_active

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="org:update_status",
        module=PermissionModule.ORGANISATION,
        description=f"Updated status for organization '{org.name}' to {body.status.value}",
        entity_id=org.id,
        entity_type="Organisation",
        entity_name=org.name,
        before_state={"status": old_status, "is_active": old_active},
        after_state={"status": body.status.value, "is_active": org.is_active},
        risk_level=RiskLevel.HIGH
    )

    await db.commit()

    return success(
        data={
            "id": org.id,
            "status": org.status.value if hasattr(org.status, "value") else str(org.status),
            "is_active": org.is_active
        },
        message=f"Organization '{org.name}' status updated to {org.status.value}."
    )


@router.delete(
    "/orgs/{org_id}",
    summary="Delete an organization",
    dependencies=[require_roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)]
)
async def delete_admin_organization(
    org_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    res = await db.execute(select(Organisation).where(Organisation.id == org_id))
    org = res.scalar_one_or_none()
    if not org:
        raise NotFound("Organization not found")

    org_name = org.name
    org_domain = org.domain

    # Unlink users before deleting
    await db.execute(
        update(User).where(User.org_id == org_id).values(org_id=None, department_id=None)
    )

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="org:delete",
        module=PermissionModule.ORGANISATION,
        description=f"Deleted organization '{org_name}' ({org_domain})",
        entity_id=org_id,
        entity_type="Organisation",
        entity_name=org_name,
        before_state={"name": org_name, "domain": org_domain},
        risk_level=RiskLevel.CRITICAL
    )

    await db.delete(org)
    await db.commit()

    return success(message=f"Organization '{org_name}' successfully removed.")
