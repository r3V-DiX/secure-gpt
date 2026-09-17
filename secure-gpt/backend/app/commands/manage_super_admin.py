import argparse
import asyncio
import sys
from datetime import datetime

from app.core.database import AsyncSessionLocal
from app.models.rbac import Role, UserRoleAssignment
from app.models.user import User, UserRole
from app.commands.seed_rbac import seed_rbac
from sqlalchemy import select


async def manage_admin(email: str, action: str):
    email = email.strip().lower()
    async with AsyncSessionLocal() as session:
        # 1. Ensure RBAC roles exist
        result = await session.execute(select(Role).where(Role.slug == "super_admin"))
        super_admin_role = result.scalar_one_or_none()
        if not super_admin_role:
            print("⚙️ Seeding RBAC roles and permissions...")
            await seed_rbac()
            result = await session.execute(select(Role).where(Role.slug == "super_admin"))
            super_admin_role = result.scalar_one_or_none()

        result = await session.execute(select(Role).where(Role.slug == "user"))
        standard_role = result.scalar_one_or_none()

        # 2. Get user or auto-create if adding
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if action == "add":
            if not user:
                print(f"👤 User '{email}' not found. Creating new user...")
                user = User(
                    email=email,
                    full_name=email.split("@")[0].replace(".", " ").title(),
                    role=UserRole.SUPER_ADMIN,
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                await session.flush()
                print(f"✨ Created user account for '{email}'.")
            else:
                user.role = UserRole.SUPER_ADMIN
                user.is_active = True

            # Clear existing role assignments
            await session.execute(
                UserRoleAssignment.__table__.delete().where(UserRoleAssignment.user_id == user.id)
            )
            # Create super admin role assignment
            if super_admin_role:
                assignment = UserRoleAssignment(user_id=user.id, role_id=super_admin_role.id, is_active=True)
                session.add(assignment)

            await session.commit()
            print(f"✅ Successfully granted Super Admin rights to '{email}'.")

        elif action in ["delete", "remove"]:
            if not user:
                print(f"❌ Error: User '{email}' does not exist.")
                sys.exit(1)

            user.role = UserRole.USER

            # Clear existing role assignments
            await session.execute(
                UserRoleAssignment.__table__.delete().where(UserRoleAssignment.user_id == user.id)
            )
            if standard_role:
                assignment = UserRoleAssignment(user_id=user.id, role_id=standard_role.id, is_active=True)
                session.add(assignment)

            await session.commit()
            print(f"✅ Successfully revoked Super Admin rights from '{email}'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage super admin privileges for a user.")
    parser.add_argument("action", choices=["add", "remove", "delete"], help="Action to perform (add or remove)")
    parser.add_argument("email", help="Email of the user")
    args = parser.parse_args()

    asyncio.run(manage_admin(args.email, args.action))
