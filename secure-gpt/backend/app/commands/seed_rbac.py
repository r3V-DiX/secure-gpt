# backend/app/commands/seed_rbac.py

import asyncio

from app.core.database import AsyncSessionLocal
from app.models.rbac import (
    Permission,
    PermissionModule,
    RiskLevel,
    Role,
    RolePermission,
    UserRoleAssignment,
)
from app.models.user import User, UserRole
from sqlalchemy import select

permissions_to_seed = [
    # ── USER Management ──
    {"action": "user:create", "module": PermissionModule.USER, "name": "Create User", "risk_level": RiskLevel.HIGH},
    {"action": "user:update", "module": PermissionModule.USER, "name": "Update User", "risk_level": RiskLevel.MEDIUM},
    {"action": "user:delete", "module": PermissionModule.USER, "name": "Delete User", "risk_level": RiskLevel.CRITICAL},
    {"action": "user:view_all", "module": PermissionModule.USER, "name": "View All Users", "risk_level": RiskLevel.LOW},
    {"action": "user:suspend", "module": PermissionModule.USER, "name": "Suspend User Account", "risk_level": RiskLevel.HIGH},
    {"action": "user:activate", "module": PermissionModule.USER, "name": "Activate User Account", "risk_level": RiskLevel.HIGH},

    # ── POLICY Configuration ──
    {"action": "policy:create", "module": PermissionModule.POLICY, "name": "Create Policy", "risk_level": RiskLevel.HIGH},
    {"action": "policy:update", "module": PermissionModule.POLICY, "name": "Update Policy", "risk_level": RiskLevel.HIGH},
    {"action": "policy:delete", "module": PermissionModule.POLICY, "name": "Delete Policy", "risk_level": RiskLevel.CRITICAL},
    {"action": "policy:view", "module": PermissionModule.POLICY, "name": "View Policy", "risk_level": RiskLevel.LOW},
    {"action": "policy:view_all", "module": PermissionModule.POLICY, "name": "View All Policies", "risk_level": RiskLevel.LOW},

    # ── SYSTEM settings & logs ──
    {"action": "system:view_dashboard", "module": PermissionModule.SYSTEM, "name": "View Admin Dashboard", "risk_level": RiskLevel.LOW},
    {"action": "system:view_logs", "module": PermissionModule.SYSTEM, "name": "View System Logs", "risk_level": RiskLevel.LOW},
    {"action": "system:manage_settings", "module": PermissionModule.SYSTEM, "name": "Manage System Settings", "risk_level": RiskLevel.CRITICAL},

    # ── AUDIT logs ──
    {"action": "audit:view_all", "module": PermissionModule.AUDIT, "name": "View All Audit Logs", "risk_level": RiskLevel.LOW},
    {"action": "audit:export", "module": PermissionModule.AUDIT, "name": "Export Audit Logs", "risk_level": RiskLevel.MEDIUM},

    # ── ROLE management ──
    {"action": "role:create", "module": PermissionModule.ROLE, "name": "Create Role", "risk_level": RiskLevel.CRITICAL},
    {"action": "role:edit", "module": PermissionModule.ROLE, "name": "Edit Role", "risk_level": RiskLevel.CRITICAL},
    {"action": "role:delete", "module": PermissionModule.ROLE, "name": "Delete Role", "risk_level": RiskLevel.CRITICAL},
    {"action": "role:view", "module": PermissionModule.ROLE, "name": "View Roles", "risk_level": RiskLevel.LOW},
]


roles_to_seed = [
    {
        "name": "Super Admin",
        "slug": "super_admin",
        "description": "Full system access. Cannot be modified.",
        "is_system": True,
    },
    {
        "name": "Security Admin",
        "slug": "security_admin",
        "description": "Manages users, organization policies, and general system configuration.",
        "is_system": True,
    },
    {
        "name": "Auditor",
        "slug": "auditor",
        "description": "Read-only access to policies, intercept logs, and system audit trails.",
        "is_system": True,
    },
    {
        "name": "Standard User",
        "slug": "user",
        "description": "Default role for employees. Access is restricted to personal profile.",
        "is_system": True,
    },
]


role_permissions_mapping = {
    "super_admin": [p["action"] for p in permissions_to_seed],
    "security_admin": [
        "user:create", "user:update", "user:view_all", "user:suspend", "user:activate",
        "policy:create", "policy:update", "policy:view", "policy:view_all",
        "system:view_dashboard", "system:view_logs",
        "audit:view_all", "role:view"
    ],
    "auditor": [
        "user:view_all",
        "policy:view", "policy:view_all",
        "system:view_dashboard", "system:view_logs",
        "audit:view_all", "role:view"
    ],
    "user": [
        "policy:view"
    ],
}


async def seed_rbac():
    print("🔐 Seeding RBAC — Roles, Permissions, Mappings...")
    async with AsyncSessionLocal() as session:
        # 1. Seed Permissions
        print("📋 Seeding permissions...")
        permission_map = {}
        for perm in permissions_to_seed:
            result = await session.execute(select(Permission).where(Permission.action == perm["action"]))
            db_perm = result.scalar_one_or_none()
            if not db_perm:
                db_perm = Permission(
                    action=perm["action"],
                    module=perm["module"],
                    name=perm["name"],
                    risk_level=perm["risk_level"],
                    is_active=True
                )
                session.add(db_perm)
                await session.flush()
            permission_map[perm["action"]] = db_perm

        # 2. Seed Roles
        print("👥 Seeding roles...")
        role_map = {}
        for role_data in roles_to_seed:
            result = await session.execute(select(Role).where(Role.slug == role_data["slug"]))
            db_role = result.scalar_one_or_none()
            if not db_role:
                db_role = Role(
                    name=role_data["name"],
                    slug=role_data["slug"],
                    description=role_data["description"],
                    is_system=role_data["is_system"],
                    is_active=True
                )
                session.add(db_role)
                await session.flush()
            role_map[role_data["slug"]] = db_role

        # 3. Role-Permission mappings
        print("🔗 Mapping role permissions...")
        for slug, actions in role_permissions_mapping.items():
            db_role = role_map[slug]
            # Clear existing mapped permissions to avoid duplicates
            await session.execute(
                RolePermission.__table__.delete().where(RolePermission.role_id == db_role.id)
            )
            for action in actions:
                db_perm = permission_map[action]
                role_perm = RolePermission(role_id=db_role.id, permission_id=db_perm.id)
                session.add(role_perm)
        await session.flush()

        # 4. Migrate existing users from simple `role` column to assignments
        print("👤 Assigning roles to existing users...")
        result = await session.execute(select(User))
        all_users = result.scalars().all()
        for user in all_users:
            slug_mapping = {
                UserRole.SUPER_ADMIN: "super_admin",
                UserRole.SECURITY_ADMIN: "security_admin",
                UserRole.AUDITOR: "auditor",
                UserRole.USER: "user"
            }
            target_slug = slug_mapping.get(user.role, "user")
            db_role = role_map[target_slug]

            # Check if assignment already exists
            assignment_result = await session.execute(
                select(UserRoleAssignment).where(
                    UserRoleAssignment.user_id == user.id,
                    UserRoleAssignment.role_id == db_role.id
                )
            )
            existing = assignment_result.scalar_one_or_none()
            if not existing:
                assignment = UserRoleAssignment(user_id=user.id, role_id=db_role.id, is_active=True)
                session.add(assignment)
                print(f"  ✓ Assigned role '{db_role.name}' to user {user.email}")

        await session.commit()
        print("🎉 RBAC seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_rbac())
