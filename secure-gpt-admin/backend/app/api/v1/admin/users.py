# backend/app/api/v1/admin/users.py
import logging
from datetime import datetime, timezone
import asyncio
from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.dependencies import DBSession, CurrentUser, has_permission
from app.core.exceptions import NotFound, Forbidden
from app.core.response import success
from app.models.user import User
from app.models.session import Session
from app.models.device import Device
from app.models.policy import Policy
from app.models.rbac import (
    Role,
    UserRoleAssignment,
    PermissionModule,
    RiskLevel
)
from app.schemas.rbac_schema import (
    RoleResponse,
    UserRoleAssignmentRequest
)
from app.services.rbac_service import (
    get_user_roles,
    log_admin_action
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["admin-users"])


class UserInviteRequest(BaseModel):
    email: EmailStr


class UserOrgUpdateRequest(BaseModel):
    orgId: str | None


@router.get(
    "/users",
    response_model=dict,
    summary="List all users with their dynamic roles",
    dependencies=[has_permission("user:view_all")]
)
async def list_users(current_user: CurrentUser, db: DBSession):
    stmt = (
        select(User)
        .options(
            selectinload(User.role_assignments).selectinload(UserRoleAssignment.role)
        )
    )

    if current_user.org_id:
        stmt = stmt.where(User.org_id == current_user.org_id)

    stmt = stmt.order_by(User.email)
    result = await db.execute(stmt)
    users = result.scalars().all()

    user_data_list = []
    for u in users:
        # Skip users whose grace period has expired (they are waiting for physical purge)
        if not u.is_active and u.deactivated_at and (datetime.now(timezone.utc) - u.deactivated_at).days > 45:
            continue

        # Resolve active dynamic roles
        assigned_roles = [
            RoleResponse.model_validate(assign.role)
            for assign in u.role_assignments
            if assign.is_active and assign.role.is_active
        ]
        user_data_list.append({
            "id": u.id,
            "email": u.email,
            "fullName": u.full_name,
            "avatarUrl": u.avatar_url,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role).lower(),  # Legacy role enum string
            "isActive": u.is_active,
            "orgId": u.org_id,
            "createdAt": u.created_at,
            "lastLoginAt": u.last_login_at,
            "deactivatedAt": u.deactivated_at.isoformat() if u.deactivated_at else None,
            "deactivationReason": u.deactivation_reason,
            "roles": assigned_roles
        })

    return success(data=user_data_list, message="Users list fetched successfully")


@router.post(
    "/users/invite",
    summary="Invite a user to your organization by email",
    dependencies=[has_permission("user:update")]
)
async def invite_user(
    body: UserInviteRequest,
    current_user: CurrentUser,
    db: DBSession
):
    if not current_user.org_id:
        raise Forbidden("You must be part of an organization to invite users. Global admins cannot invite users directly without specifying an organization.")

    email_lower = body.email.lower().strip()
    
    stmt = select(User).where(User.email == email_lower)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.org_id and existing_user.org_id != current_user.org_id:
            raise Forbidden("This user is already part of another organization.")
        
        # User exists but no org_id, assign them to this org
        existing_user.org_id = current_user.org_id
        await db.commit()
        return success(message="User already existed and was successfully added to your organization.")
    
    # Create new placeholder user
    new_user = User(
        email=email_lower,
        full_name=email_lower.split('@')[0],
        org_id=current_user.org_id,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    
    return success(message="User invited successfully.")


@router.put(
    "/users/{user_id}/roles",
    summary="Update user dynamic roles assignment",
    dependencies=[has_permission("user:update")]
)
async def update_user_roles(
    user_id: str,
    body: UserRoleAssignmentRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise NotFound("User not found")

    # Check current caller roles
    current_roles = await get_user_roles(db, current_user.id)
    current_slugs = {r.slug for r in current_roles}
    is_current_super = "super_admin" in current_slugs

    # Check target user roles
    target_roles = await get_user_roles(db, target_user.id)
    target_slugs = {r.slug for r in target_roles}

    # Prevent non-Super Admin from modifying a Super Admin's roles
    if "super_admin" in target_slugs and not is_current_super:
        raise Forbidden("Non-Super Admin users cannot modify a Super Admin's roles")

    # Prevent non-Super Admin from assigning the super_admin role
    if "super_admin" in body.roleSlugs and not is_current_super:
        raise Forbidden("Non-Super Admin users cannot grant the Super Admin role")

    # Fetch corresponding roles from database
    role_stmt = select(Role).where(Role.slug.in_(body.roleSlugs))
    role_res = await db.execute(role_stmt)
    db_roles = role_res.scalars().all()

    # Clear existing role assignments
    del_stmt = UserRoleAssignment.__table__.delete().where(UserRoleAssignment.user_id == user_id)
    await db.execute(del_stmt)

    # Insert new role assignments
    for role in db_roles:
        assign = UserRoleAssignment(user_id=user_id, role_id=role.id, is_active=True)
        db.add(assign)

    # Log admin action
    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="user:update_roles",
        module=PermissionModule.USER,
        description=f"Updated roles for user {target_user.email} to {body.roleSlugs}",
        entity_id=target_user.id,
        entity_type="User",
        entity_name=target_user.email,
        after_state={"roles": body.roleSlugs},
        risk_level=RiskLevel.MEDIUM
    )

    await db.commit()
    return success(message="User roles updated successfully")


@router.put(
    "/users/{user_id}/org",
    summary="Update user organization assignment",
    dependencies=[has_permission("user:update")]
)
async def update_user_org(
    user_id: str,
    body: UserOrgUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise NotFound("User not found")

    old_org = target_user.org_id
    new_org = body.orgId

    if new_org:
        # Check if organization exists, if not, create it to prevent ForeignKey violation
        from app.models.org import Organisation
        org_stmt = select(Organisation).where(Organisation.id == new_org)
        org_res = await db.execute(org_stmt)
        organisation = org_res.scalar_one_or_none()
        if not organisation:
            organisation = Organisation(
                id=new_org,
                name=new_org.capitalize(),
                admin_email=current_user.email
            )
            db.add(organisation)
            await db.flush()

    target_user.org_id = new_org

    # Log admin action
    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="user:update_org",
        module=PermissionModule.USER,
        description=f"Updated organization for user {target_user.email} from {old_org} to {new_org}",
        entity_id=target_user.id,
        entity_type="User",
        entity_name=target_user.email,
        before_state={"orgId": old_org},
        after_state={"orgId": new_org},
        risk_level=RiskLevel.MEDIUM
    )

    await db.commit()
    return success(message="User organization updated successfully")


@router.put(
    "/users/{user_id}/status",
    summary="Toggle user active status (suspend/activate)",
    dependencies=[has_permission("user:suspend")]
)
async def toggle_user_status(
    user_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise NotFound("User not found")

    if target_user.id == current_user.id:
        raise Forbidden("You cannot suspend your own account")

    # Check if target is a super_admin
    target_roles = await get_user_roles(db, target_user.id)
    target_slugs = {r.slug for r in target_roles}

    if "super_admin" in target_slugs:
        # Resolve caller roles
        current_roles = await get_user_roles(db, current_user.id)
        current_slugs = {r.slug for r in current_roles}
        if "super_admin" not in current_slugs:
            raise Forbidden("Non-Super Admin users cannot suspend or activate Super Admin accounts")

    old_status = target_user.is_active
    new_status = not old_status
    target_user.is_active = new_status
    if not new_status:
        target_user.deactivated_at = datetime.now(timezone.utc)
        target_user.deactivation_reason = "deactivation"
        target_user.pre_deletion_email_sent = False
        
        # Send deactivation confirmation email to the user
        from app.services.email_service import send_deactivation_email
        asyncio.create_task(send_deactivation_email(target_user.email))
    else:
        target_user.deactivated_at = None
        target_user.deactivation_reason = None
        target_user.pre_deletion_email_sent = False

    action = "user:activate" if new_status else "user:suspend"

    # Log admin action
    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action=action,
        module=PermissionModule.USER,
        description=f"{'Activated' if new_status else 'Suspended'} user account {target_user.email}",
        entity_id=target_user.id,
        entity_type="User",
        entity_name=target_user.email,
        before_state={"isActive": old_status},
        after_state={"isActive": new_status},
        risk_level=RiskLevel.HIGH
    )

    await db.commit()
    return success(
        data={"isActive": new_status},
        message=f"User account {'activated' if new_status else 'suspended'} successfully"
    )


@router.delete(
    "/users/{user_id}",
    summary="Permanently delete user and revoke all sessions/devices",
    dependencies=[has_permission("user:delete")]
)
async def delete_user(
    user_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise NotFound("User not found")

    if target_user.id == current_user.id:
        raise Forbidden("You cannot delete your own account from the admin dashboard")

    target_roles = await get_user_roles(db, target_user.id)
    target_slugs = {r.slug for r in target_roles}

    current_roles = await get_user_roles(db, current_user.id)
    current_slugs = {r.slug for r in current_roles}
    is_current_super = "super_admin" in current_slugs

    if "super_admin" in target_slugs and not is_current_super:
        raise Forbidden("Non-Super Admin users cannot delete a Super Admin account")

    # If org admin, ensure user is within their own org
    if not is_current_super and current_user.org_id:
        if target_user.org_id != current_user.org_id:
            raise Forbidden("Cannot delete users from another organization")

    # 1. Clear role assignments
    await db.execute(UserRoleAssignment.__table__.delete().where(UserRoleAssignment.user_id == user_id))

    # 2. Terminate all active sessions
    await db.execute(delete(Session).where(Session.user_id == user_id))

    # 3. Delete registered extension devices
    await db.execute(delete(Device).where(Device.user_id == user_id))

    # 4. Delete user custom policies
    await db.execute(delete(Policy).where(Policy.user_id == user_id))

    # 5. Log admin audit entry
    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="user:delete",
        module=PermissionModule.USER,
        description=f"Permanently deleted user {target_user.email}",
        entity_id=target_user.id,
        entity_type="User",
        entity_name=target_user.email,
        before_state={"email": target_user.email, "orgId": target_user.org_id},
        risk_level=RiskLevel.CRITICAL
    )

    # 6. Permanently remove from database
    await db.delete(target_user)
    await db.commit()

    return success(message=f"User {target_user.email} permanently removed.")
