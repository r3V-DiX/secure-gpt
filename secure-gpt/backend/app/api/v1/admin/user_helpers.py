"""
Helper services, permission validation, and purge routines for Admin Users.
"""
import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, delete
from app.models.user import User
from app.models.org import Organisation
from app.models.session import Session
from app.models.device import Device
from app.models.policy import Policy
from app.models.rbac import UserRoleAssignment, Role, PermissionModule, RiskLevel
from app.schemas.rbac_schema import RoleResponse
from app.services.rbac_service import get_user_roles, log_admin_action
from app.services.email_service import send_deactivation_email
from app.core.exceptions import Forbidden, NotFound


async def serialize_admin_users(users):
    user_data_list = []
    now = datetime.now(timezone.utc)
    for u in users:
        if not u.is_active and u.deactivated_at and (now - u.deactivated_at).days > 45:
            continue
        assigned_roles = [
            RoleResponse.model_validate(assign.role)
            for assign in u.role_assignments
            if assign.is_active and assign.role.is_active
        ]
        user_data_list.append({
            "id": u.id, "email": u.email, "fullName": u.full_name, "avatarUrl": u.avatar_url,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role).lower(),
            "isActive": u.is_active, "orgId": u.org_id, "createdAt": u.created_at,
            "lastLoginAt": u.last_login_at, "deactivatedAt": u.deactivated_at.isoformat() if u.deactivated_at else None,
            "deactivationReason": u.deactivation_reason, "roles": assigned_roles,
        })
    return user_data_list


async def check_super_admin_mutation_permission(db, current_user_id: str, target_user_id: str, requested_roles: list[str] | None = None):
    current_roles = await get_user_roles(db, current_user_id)
    is_current_super = any(r.slug == "super_admin" for r in current_roles)
    target_roles = await get_user_roles(db, target_user_id)
    is_target_super = any(r.slug == "super_admin" for r in target_roles)

    if is_target_super and not is_current_super:
        raise Forbidden("Non-Super Admin users cannot modify or act upon a Super Admin account")
    if requested_roles and "super_admin" in requested_roles and not is_current_super:
        raise Forbidden("Non-Super Admin users cannot grant the Super Admin role")
    return is_current_super


async def handle_admin_user_org_update(db, user_id: str, new_org: str | None, current_user, request):
    res = await db.execute(select(User).where(User.id == user_id))
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise NotFound("User not found")

    old_org = target_user.org_id
    if new_org:
        org_res = await db.execute(select(Organisation).where(Organisation.id == new_org))
        if not org_res.scalar_one_or_none():
            db.add(Organisation(id=new_org, name=new_org.capitalize(), admin_email=current_user.email))
            await db.flush()

    target_user.org_id = new_org
    await log_admin_action(
        db, request=request, user=current_user, action="user:update_org",
        module=PermissionModule.USER,
        description=f"Updated organization for user {target_user.email} from {old_org} to {new_org}",
        entity_id=target_user.id, entity_type="User", entity_name=target_user.email,
        before_state={"orgId": old_org}, after_state={"orgId": new_org}, risk_level=RiskLevel.MEDIUM,
    )
    await db.commit()


async def handle_admin_user_status_toggle(db, user_id: str, current_user, request):
    res = await db.execute(select(User).where(User.id == user_id))
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise NotFound("User not found")
    if target_user.id == current_user.id:
        raise Forbidden("You cannot suspend your own account")

    await check_super_admin_mutation_permission(db, current_user.id, target_user.id)

    old_status = target_user.is_active
    new_status = not old_status
    target_user.is_active = new_status
    if not new_status:
        target_user.deactivated_at = datetime.now(timezone.utc)
        target_user.deactivation_reason = "deactivation"
        target_user.pre_deletion_email_sent = False
        asyncio.create_task(send_deactivation_email(target_user.email))
    else:
        target_user.deactivated_at = None
        target_user.deactivation_reason = None
        target_user.pre_deletion_email_sent = False

    action = "user:activate" if new_status else "user:suspend"
    await log_admin_action(
        db, request=request, user=current_user, action=action, module=PermissionModule.USER,
        description=f"{'Activated' if new_status else 'Suspended'} user account {target_user.email}",
        entity_id=target_user.id, entity_type="User", entity_name=target_user.email,
        before_state={"isActive": old_status}, after_state={"isActive": new_status}, risk_level=RiskLevel.HIGH,
    )
    await db.commit()
    return new_status


async def purge_user_resources(db, user_id: str):
    await db.execute(UserRoleAssignment.__table__.delete().where(UserRoleAssignment.user_id == user_id))
    await db.execute(delete(Session).where(Session.user_id == user_id))
    await db.execute(delete(Device).where(Device.user_id == user_id))
    await db.execute(delete(Policy).where(Policy.user_id == user_id))
