# backend/app/api/v1/admin/roles.py
import logging
from fastapi import APIRouter, Request
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.dependencies import DBSession, CurrentUser, has_permission
from app.core.exceptions import NotFound, Forbidden, ValidationError
from app.core.response import success
from app.models.rbac import (
    Role,
    Permission,
    RolePermission,
    UserRoleAssignment,
    PermissionModule,
    RiskLevel
)
from app.schemas.rbac_schema import (
    RoleResponse,
    RoleCreateRequest,
    RoleUpdateRequest,
    RolePermissionsUpdateRequest,
    PermissionResponse
)
from app.services.rbac_service import log_admin_action

logger = logging.getLogger(__name__)
router = APIRouter(tags=["admin-roles"])


@router.get(
    "/roles",
    response_model=dict,
    summary="List all system and custom roles with permissions",
    dependencies=[has_permission("role:view")]
)
async def list_roles(db: DBSession):
    stmt = (
        select(Role)
        .options(
            selectinload(Role.permissions).selectinload(RolePermission.permission)
        )
        .order_by(Role.slug)
    )
    result = await db.execute(stmt)
    roles = result.scalars().all()

    roles_data = []
    for r in roles:
        permissions = [
            PermissionResponse.model_validate(rp.permission)
            for rp in r.permissions
            if rp.permission.is_active
        ]
        user_count_stmt = select(func.count(UserRoleAssignment.id)).where(
            UserRoleAssignment.role_id == r.id,
            UserRoleAssignment.is_active == True
        )
        user_count_res = await db.execute(user_count_stmt)
        user_count = user_count_res.scalar_one()

        role_dict = RoleResponse.model_validate(r).__dict__
        role_dict["permissions"] = permissions
        role_dict["userCount"] = user_count
        roles_data.append(role_dict)

    return success(data=roles_data, message="Roles fetched successfully")


@router.post(
    "/roles",
    summary="Create a custom security role",
    dependencies=[has_permission("role:create")]
)
async def create_role(
    body: RoleCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    # Verify slug doesn't exist
    chk_stmt = select(Role).where(Role.slug == body.slug)
    res = await db.execute(chk_stmt)
    if res.scalar_one_or_none():
        raise ValidationError("Role slug already exists")

    new_role = Role(
        name=body.name,
        slug=body.slug,
        description=body.description,
        is_system=False,
        is_active=True
    )
    db.add(new_role)
    await db.flush()

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="role:create",
        module=PermissionModule.ROLE,
        description=f"Created custom role '{body.name}' ({body.slug})",
        entity_id=new_role.id,
        entity_type="Role",
        entity_name=new_role.slug,
        after_state={"name": body.name, "slug": body.slug, "description": body.description},
        risk_level=RiskLevel.HIGH
    )

    await db.commit()
    return success(message="Custom role created successfully")


@router.put(
    "/roles/{role_id}",
    summary="Update role description/status",
    dependencies=[has_permission("role:edit")]
)
async def update_role(
    role_id: str,
    body: RoleUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    stmt = select(Role).where(Role.id == role_id)
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()
    if not role:
        raise NotFound("Role not found")

    before_state = {"name": role.name, "description": role.description, "isActive": role.is_active}

    if body.name:
        role.name = body.name
    if body.description is not None:
        role.description = body.description
    if body.isActive is not None:
        if role.is_system and not body.isActive:
            raise Forbidden("Cannot disable system roles")
        role.is_active = body.isActive

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="role:edit",
        module=PermissionModule.ROLE,
        description=f"Updated role metadata for '{role.slug}'",
        entity_id=role.id,
        entity_type="Role",
        entity_name=role.slug,
        before_state=before_state,
        after_state={"name": role.name, "description": role.description, "isActive": role.is_active},
        risk_level=RiskLevel.MEDIUM
    )

    await db.commit()
    return success(message="Role updated successfully")


@router.delete(
    "/roles/{role_id}",
    summary="Delete a custom security role",
    dependencies=[has_permission("role:delete")]
)
async def delete_role(
    role_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    stmt = select(Role).where(Role.id == role_id)
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()
    if not role:
        raise NotFound("Role not found")
    if role.is_system:
        raise Forbidden("System roles cannot be deleted")

    # Check if user count assigned to this role is 0
    count_stmt = select(func.count(UserRoleAssignment.id)).where(UserRoleAssignment.role_id == role_id)
    count_res = await db.execute(count_stmt)
    assignment_count = count_res.scalar_one()
    if assignment_count > 0:
        raise ValidationError("Role is currently assigned to users — reassign them first")

    # Clear old role-permissions mapping
    del_stmt = RolePermission.__table__.delete().where(RolePermission.role_id == role_id)
    await db.execute(del_stmt)

    # Delete the role itself
    await db.delete(role)

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="role:delete",
        module=PermissionModule.ROLE,
        description=f"Deleted custom role '{role.name}' ({role.slug})",
        entity_id=role_id,
        entity_type="Role",
        entity_name=role.slug,
        before_state={"name": role.name, "slug": role.slug, "description": role.description},
        risk_level=RiskLevel.HIGH
    )

    await db.commit()
    return success(message="Role deleted successfully")


@router.put(
    "/roles/{role_id}/permissions",
    summary="Update permissions associated with a role",
    dependencies=[has_permission("role:edit")]
)
async def update_role_permissions(
    role_id: str,
    body: RolePermissionsUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
):
    stmt = select(Role).where(Role.id == role_id)
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()
    if not role:
        raise NotFound("Role not found")

    if role.is_system and role.slug == "super_admin":
        raise Forbidden("Super Admin permissions cannot be modified")

    # Fetch corresponding permissions by action strings
    perm_stmt = select(Permission).where(Permission.action.in_(body.permissionActions))
    perm_res = await db.execute(perm_stmt)
    db_perms = perm_res.scalars().all()

    # Clear old role-permissions mapping
    del_stmt = RolePermission.__table__.delete().where(RolePermission.role_id == role_id)
    await db.execute(del_stmt)

    # Insert new role-permissions mapping
    for perm in db_perms:
        rp = RolePermission(role_id=role_id, permission_id=perm.id)
        db.add(rp)

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="role:assign_permission",
        module=PermissionModule.ROLE,
        description=f"Updated permission set for role '{role.slug}' to {body.permissionActions}",
        entity_id=role.id,
        entity_type="Role",
        entity_name=role.slug,
        after_state={"permissions": body.permissionActions},
        risk_level=RiskLevel.CRITICAL
    )

    await db.commit()
    return success(message="Role permissions updated successfully")
