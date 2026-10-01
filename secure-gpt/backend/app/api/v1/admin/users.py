# backend/app/api/v1/admin/users.py
import logging
import asyncio
from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import DBSession, CurrentUser, has_permission
from app.core.exceptions import NotFound, Forbidden
from app.core.response import success
from app.models.user import User
from app.models.rbac import (
    Role,
    UserRoleAssignment,
    PermissionModule,
    RiskLevel
)
from app.schemas.rbac_schema import UserRoleAssignmentRequest
from app.services.rbac_service import log_admin_action
from app.services.email_notifications import send_role_change_notification_email
from app.api.v1.admin.user_helpers import (
    serialize_admin_users,
    check_super_admin_mutation_permission,
    handle_admin_user_org_update,
    handle_admin_user_status_toggle,
    handle_admin_bulk_user_action,
    purge_user_resources,
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

    user_data_list = await serialize_admin_users(users)
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
        existing_user.org_id = current_user.org_id
        await db.commit()
        return success(message="User already existed and was successfully added to your organization.")

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

    await check_super_admin_mutation_permission(db, current_user.id, target_user.id, body.roleSlugs)

    role_stmt = select(Role).where(Role.slug.in_(body.roleSlugs))
    role_res = await db.execute(role_stmt)
    db_roles = role_res.scalars().all()

    del_stmt = UserRoleAssignment.__table__.delete().where(UserRoleAssignment.user_id == user_id)
    await db.execute(del_stmt)

    for role in db_roles:
        assign = UserRoleAssignment(user_id=user_id, role_id=role.id, is_active=True)
        db.add(assign)

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

    asyncio.create_task(
        send_role_change_notification_email(
            to_email=target_user.email,
            new_roles=body.roleSlugs,
            updated_by=current_user.email,
        )
    )
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
    await handle_admin_user_org_update(db, user_id, body.orgId, current_user, request)
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
    new_status = await handle_admin_user_status_toggle(db, user_id, current_user, request)
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

    is_current_super = await check_super_admin_mutation_permission(db, current_user.id, target_user.id)
    if not is_current_super and current_user.org_id and target_user.org_id != current_user.org_id:
        raise Forbidden("Cannot delete users from another organization")

    await purge_user_resources(db, user_id)

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

    await db.delete(target_user)
    await db.commit()
    return success(message=f"User {target_user.email} permanently removed.")


class AdminBulkUserActionRequest(BaseModel):
    user_ids: list[str]
    action: str  # "assign_org" | "assign_roles" | "deactivate" | "activate" | "delete"
    org_id: str | None = None
    role_slugs: list[str] | None = None


@router.post(
    "/users/bulk",
    summary="Perform bulk user actions (delete, deactivate, activate, assign org/roles)",
    dependencies=[has_permission("user:update")]
)
async def bulk_user_actions(
    body: AdminBulkUserActionRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    affected = await handle_admin_bulk_user_action(db, body, current_user, request)
    return success(
        data={"affected": affected, "action": body.action},
        message=f"Bulk action '{body.action}' successfully executed on {affected} user(s)."
    )
