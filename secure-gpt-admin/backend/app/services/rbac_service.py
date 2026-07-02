# backend/app/services/rbac_service.py

from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from app.models.rbac import Role, Permission, RolePermission, UserRoleAssignment, AdminAuditLog, PermissionModule, RiskLevel, AuditStatus
from app.models.user import User


async def get_user_permissions(db: AsyncSession, user_id: str) -> set[str]:
    """
    Fetches the set of distinct action strings (permissions) that a user is granted
    through all of their active role assignments.
    """
    stmt = (
        select(Permission.action)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRoleAssignment, UserRoleAssignment.role_id == Role.id)
        .where(
            UserRoleAssignment.user_id == user_id,
            UserRoleAssignment.is_active == True,
            Role.is_active == True,
            Permission.is_active == True
        )
    )
    result = await db.execute(stmt)
    return {row[0] for row in result.all()}


async def get_user_roles(db: AsyncSession, user_id: str) -> list[Role]:
    """
    Fetches all active Role models assigned to a user.
    """
    stmt = (
        select(Role)
        .join(UserRoleAssignment, UserRoleAssignment.role_id == Role.id)
        .where(
            UserRoleAssignment.user_id == user_id,
            UserRoleAssignment.is_active == True,
            Role.is_active == True
        )
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def log_admin_action(
    db: AsyncSession,
    request: Request,
    user: User,
    action: str,
    module: PermissionModule,
    description: str | None = None,
    entity_id: str | None = None,
    entity_type: str | None = None,
    entity_name: str | None = None,
    before_state: dict | None = None,
    after_state: dict | None = None,
    status: AuditStatus = AuditStatus.SUCCESS,
    reason: str | None = None,
    risk_level: RiskLevel = RiskLevel.LOW
) -> AdminAuditLog:
    """
    Helper to log an administrative action to admin_audit_logs.
    """
    # Fetch roles for the user doing the action
    roles = await get_user_roles(db, user.id)
    role_slugs = [r.slug for r in roles]

    # Resolve IP & User Agent
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    log_entry = AdminAuditLog(
        user_id=user.id,
        user_email=user.email,
        user_name=user.full_name,
        user_roles=role_slugs,
        action=action,
        module=module,
        description=description,
        entity_id=entity_id,
        entity_type=entity_type,
        entity_name=entity_name,
        before_state=before_state,
        after_state=after_state,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
        reason=reason,
        risk_level=risk_level,
        created_at=datetime.now(timezone.utc)
    )

    db.add(log_entry)
    await db.flush()
    return log_entry
