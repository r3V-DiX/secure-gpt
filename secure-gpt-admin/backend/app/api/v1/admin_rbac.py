# backend/app/api/v1/admin_rbac.py

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.dependencies import DBSession, CurrentUser, has_permission
from app.core.exceptions import NotFound, Forbidden, ValidationError
from app.core.response import success
from app.models.user import User
from app.models.rbac import Role, Permission, RolePermission, UserRoleAssignment, AdminAuditLog, PermissionModule, RiskLevel, AuditStatus
from app.schemas.rbac_schema import (
    PermissionResponse,
    RoleResponse,
    RoleCreateRequest,
    RoleUpdateRequest,
    RolePermissionsUpdateRequest,
    UserRoleAssignmentRequest,
    AdminUserResponse,
    AdminAuditLogResponse
)
from app.services.rbac_service import log_admin_action

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin-rbac"])


# ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

@router.get(
    "/users",
    response_model=dict,
    summary="List all users with their dynamic roles",
    dependencies=[has_permission("user:view_all")]
)
async def list_users(current_user: CurrentUser, db: DBSession):
    from app.services.rbac_service import get_user_roles
    
    current_roles = await get_user_roles(db, current_user.id)
    current_slugs = {r.slug for r in current_roles}
    is_super = "super_admin" in current_slugs

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
            "role": u.role.value,  # Legacy role enum string
            "isActive": u.is_active,
            "orgId": u.org_id,
            "createdAt": u.created_at,
            "lastLoginAt": u.last_login_at,
            "deactivatedAt": u.deactivated_at.isoformat() if u.deactivated_at else None,
            "deactivationReason": u.deactivation_reason,
            "roles": assigned_roles
        })

    return success(data=user_data_list, message="Users list fetched successfully")


from pydantic import BaseModel, EmailStr

class UserInviteRequest(BaseModel):
    email: EmailStr

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
    from app.services.rbac_service import get_user_roles
    
    current_roles = await get_user_roles(db, current_user.id)
    current_slugs = {r.slug for r in current_roles}
    is_super = "super_admin" in current_slugs

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

    from app.services.rbac_service import get_user_roles
    
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
    new_assignments = []
    for role in db_roles:
        assign = UserRoleAssignment(user_id=user_id, role_id=role.id, is_active=True)
        db.add(assign)
        new_assignments.append(role.slug)

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


from pydantic import BaseModel

class UserOrgUpdateRequest(BaseModel):
    orgId: str | None


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
    dependencies=[has_permission("user:suspend")]  # Checks user:suspend or user:activate
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

    from app.services.rbac_service import get_user_roles

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
        import asyncio
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


# ─── ROLE MANAGEMENT ─────────────────────────────────────────────────────────

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
    from sqlalchemy import func
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


# ─── PERMISSIONS LIST ────────────────────────────────────────────────────────

@router.get(
    "/permissions",
    response_model=dict,
    summary="List all granular action permissions",
    dependencies=[has_permission("role:view")]
)
async def list_permissions(db: DBSession):
    stmt = select(Permission).order_by(Permission.module, Permission.action)
    res = await db.execute(stmt)
    permissions = res.scalars().all()
    data = [PermissionResponse.model_validate(p) for p in permissions]
    return success(data=data, message="Permissions list fetched successfully")


# ─── SYSTEM/ADMIN MODIFICATION LOGS (NOW SYSTEM LOGS) ─────────────────────────

@router.get(
    "/system-logs",
    response_model=dict,
    summary="Get all administrative system changes logs",
    dependencies=[has_permission("audit:view_all")]
)
async def list_system_logs(current_user: CurrentUser, db: DBSession):
    from app.services.rbac_service import get_user_roles
    
    current_roles = await get_user_roles(db, current_user.id)
    current_slugs = {r.slug for r in current_roles}
    is_super = "super_admin" in current_slugs

    stmt = select(AdminAuditLog)
    if current_user.org_id:
        stmt = stmt.join(User, AdminAuditLog.user_id == User.id, isouter=True).where(
            (User.org_id == current_user.org_id) | (AdminAuditLog.user_id == current_user.id)
        )
    stmt = stmt.order_by(AdminAuditLog.created_at.desc())
    
    res = await db.execute(stmt)
    logs_list = res.scalars().all()

    data = []
    for log in logs_list:
        data.append({
            "id": log.id,
            "userId": log.user_id,
            "userEmail": log.user_email,
            "userName": log.user_name,
            "userRoles": log.user_roles,
            "action": log.action,
            "module": log.module.value,
            "description": log.description,
            "entityId": log.entity_id,
            "entityType": log.entity_type,
            "entityName": log.entity_name,
            "beforeState": log.before_state,
            "afterState": log.after_state,
            "ipAddress": log.ip_address,
            "userAgent": log.user_agent,
            "status": log.status.value,
            "reason": log.reason,
            "riskLevel": log.risk_level.value,
            "createdAt": log.created_at
        })

    return success(data=data, message="System logs fetched successfully")


# ─── AUTHENTICATION LOGS (NOW AUDIT LOGS) ─────────────────────────────────────

@router.get(
    "/audit-logs",
    summary="Get all authentication audit logs (who logged and when)",
    dependencies=[has_permission("audit:view_all")]
)
async def list_audit_logs(current_user: CurrentUser, db: DBSession):
    from app.models.auth_event import AuthEvent
    from app.services.rbac_service import get_user_roles
    
    current_roles = await get_user_roles(db, current_user.id)
    current_slugs = {r.slug for r in current_roles}
    is_super = "super_admin" in current_slugs

    stmt = (
        select(AuthEvent)
        .options(selectinload(AuthEvent.user))
    )
    
    if current_user.org_id:
        stmt = stmt.join(User, AuthEvent.user_id == User.id, isouter=True).where(
            User.org_id == current_user.org_id
        )

    stmt = stmt.order_by(AuthEvent.created_at.desc())
    res = await db.execute(stmt)
    events = res.scalars().all()

    data = []
    for event in events:
        email = event.user.email if event.user else (event.event_metadata.get("email") if event.event_metadata else None)
        full_name = event.user.full_name if event.user else None
        data.append({
            "id": event.id,
            "userId": event.user_id,
            "userEmail": email or "System/Unknown",
            "userName": full_name or "Unknown",
            "eventType": event.event_type.value,
            "success": event.success,
            "userAgent": event.user_agent,
            "fingerprintHash": event.fingerprint_hash,
            "metadata": event.event_metadata,
            "createdAt": event.created_at
        })

    return success(data=data, message="System audit logs fetched successfully")


@router.get(
    "/audit-logs/export",
    summary="Export authentication audit logs as CSV for training ML model",
    dependencies=[has_permission("audit:view_all")]
)
async def export_audit_logs(current_user: CurrentUser, db: DBSession):
    import csv
    import io
    from datetime import datetime, timezone
    from fastapi.responses import StreamingResponse
    from app.models.auth_event import AuthEvent
    from app.services.rbac_service import get_user_roles

    current_roles = await get_user_roles(db, current_user.id)
    current_slugs = {r.slug for r in current_roles}
    is_super = "super_admin" in current_slugs

    stmt = (
        select(AuthEvent)
        .options(selectinload(AuthEvent.user))
    )

    if current_user.org_id:
        stmt = stmt.join(User, AuthEvent.user_id == User.id, isouter=True).where(
            User.org_id == current_user.org_id
        )

    stmt = stmt.order_by(AuthEvent.created_at.desc())
    res = await db.execute(stmt)
    events = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "User ID", "User Email", "User Name", "Event Type",
        "Success", "User Agent", "Fingerprint Hash", "Metadata", "Timestamp"
    ])
    for event in events:
        email = event.user.email if event.user else (event.event_metadata.get("email") if event.event_metadata else None)
        full_name = event.user.full_name if event.user else None
        writer.writerow([
            event.id,
            event.user_id or "",
            email or "System/Unknown",
            full_name or "Unknown",
            event.event_type.value,
            event.success,
            event.user_agent or "",
            event.fingerprint_hash or "",
            str(event.event_metadata) if event.event_metadata else "",
            event.created_at.isoformat()
        ])

    output.seek(0)
    filename = f"system_auth_audit_logs_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
