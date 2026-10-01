# backend/app/api/v1/admin/org_actions.py
"""
Specialized Super Admin operations on organizations:
- Emergency Killswitch (Org Freeze & session revocation)
- Tenant Impersonation ('Login-As Org' read-only session creation)
"""

import logging
from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import select

from app.core.dependencies import DBSession, CurrentUser, require_roles
from app.core.exceptions import NotFound, BadRequest, Forbidden
from app.core.config import settings
from app.core.response import success
from app.models.org import Organisation, OrgStatus
from app.models.user import User, UserRole
from app.models.rbac import PermissionModule, RiskLevel
from app.services.rbac_service import log_admin_action
from app.services.session_service import revoke_all_org_sessions, create_impersonation_handoff, HANDOFF_TTL_SECONDS
from app.services.extension_service import push_policy_update

logger = logging.getLogger(__name__)
router = APIRouter(tags=["admin-organization-actions"])


class FreezeOrgRequest(BaseModel):
    confirmation: str  # Must match 'FREEZE' or org name


@router.post(
    "/orgs/{org_id}/freeze",
    summary="Emergency Killswitch: Freeze organization and revoke all user sessions",
    dependencies=[require_roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)]
)
async def freeze_organization(
    org_id: str,
    body: FreezeOrgRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    res = await db.execute(select(Organisation).where(Organisation.id == org_id))
    org = res.scalar_one_or_none()
    if not org:
        raise NotFound("Organization not found")

    confirm_str = body.confirmation.strip()
    if confirm_str.upper() != "FREEZE" and confirm_str.lower() != org.name.lower():
        raise BadRequest(f"Confirmation must match 'FREEZE' or '{org.name}'")

    old_status = org.status.value if hasattr(org.status, "value") else str(org.status)
    org.status = OrgStatus.SUSPENDED
    org.is_active = False

    # Revoke all active sessions for users in this tenant
    revoked_count = await revoke_all_org_sessions(db, org.id)

    # Push immediate policy update to extensions to halt enforcement
    await push_policy_update(None, org.id, {
        "org_status": "SUSPENDED",
        "enforcement_disabled": True,
        "message": "Organization has been temporarily frozen by administrator."
    })

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="org:emergency_freeze",
        module=PermissionModule.ORGANISATION,
        description=f"EMERGENCY KILLSWITCH triggered for '{org.name}' ({org.domain}). Revoked {revoked_count} active sessions.",
        entity_id=org.id,
        entity_type="Organisation",
        entity_name=org.name,
        before_state={"status": old_status, "is_active": True},
        after_state={"status": "SUSPENDED", "is_active": False, "revoked_sessions": revoked_count},
        risk_level=RiskLevel.CRITICAL
    )
    await db.commit()

    return success(
        data={
            "id": org.id,
            "name": org.name,
            "status": "SUSPENDED",
            "is_active": False,
            "revoked_sessions": revoked_count,
        },
        message=f"Emergency killswitch activated. '{org.name}' is frozen and {revoked_count} active user sessions were invalidated."
    )


@router.post(
    "/orgs/{org_id}/impersonate",
    summary="Login-As Org: Create a scoped read-only impersonation session for Super Admin",
    dependencies=[require_roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN)]
)
async def impersonate_organization(
    org_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    if settings.portal_mode != "admin":
        raise Forbidden("Impersonation can only start from the admin portal")
    res = await db.execute(select(Organisation).where(Organisation.id == org_id))
    org = res.scalar_one_or_none()
    if not org:
        raise NotFound("Organization not found")

    # Find the org admin or first employee in this org to impersonate
    user_query = await db.execute(
        select(User)
        .where(User.org_id == org_id, User.is_active == True)  # noqa: E712
        .order_by(User.role.asc(), User.created_at.asc())
    )
    target_user = user_query.scalars().first()
    if not target_user:
        raise BadRequest(f"Organization '{org.name}' has no active users to inspect.")

    ticket = await create_impersonation_handoff(
        db,
        target_user_id=target_user.id,
        impersonator_id=current_user.id,
        org_id=org.id,
    )

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="org:impersonate_start",
        module=PermissionModule.ORGANISATION,
        description=f"Super Admin started read-only impersonation session into '{org.name}' as user '{target_user.email}'.",
        entity_id=org.id,
        entity_type="Organisation",
        entity_name=org.name,
        before_state=None,
        after_state={"target_user": target_user.email, "target_user_id": target_user.id},
        risk_level=RiskLevel.HIGH
    )
    await db.commit()

    return success(
        data={
            "handoff_ticket": ticket,
            "expires_in": HANDOFF_TTL_SECONDS,
        },
        message=f"Read-only impersonation session started for '{org.name}'."
    )
