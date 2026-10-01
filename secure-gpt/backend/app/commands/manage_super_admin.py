import argparse
import asyncio
import sys
from datetime import datetime

from app.core.database import AsyncSessionLocal
from app.models.rbac import Role, UserRoleAssignment
from app.models.user import User, UserRole
from app.commands.seed_rbac import seed_rbac
from sqlalchemy import select, or_, and_


async def list_super_admins():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User)
            .outerjoin(UserRoleAssignment, UserRoleAssignment.user_id == User.id)
            .outerjoin(Role, Role.id == UserRoleAssignment.role_id)
            .where(
                or_(
                    User.role.in_([UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]),
                    and_(
                        UserRoleAssignment.is_active == True,  # noqa: E712
                        Role.slug.in_(["super_admin", "platform_super_admin"]),
                    ),
                )
            )
            .distinct()
            .order_by(User.created_at.asc())
        )
        admins = result.scalars().all()

        print("\n" + "=" * 85)
        print("👑 SecureGPT Super Administrators")
        print("=" * 85)

        if not admins:
            print("No Super Administrators found in database.")
            print("=" * 85 + "\n")
            return

        print(f"Total: {len(admins)} Super Administrator(s)\n")
        header = f"{'Email':<38} | {'Full Name':<20} | {'Status':<8} | {'Last Login':<16}"
        print(header)
        print("-" * len(header))

        for admin in admins:
            status = "ACTIVE" if admin.is_active else "INACTIVE"
            last_login = admin.last_login_at.strftime("%Y-%m-%d %H:%M") if admin.last_login_at else "Never"
            name = (admin.full_name or "—")[:20]
            email = admin.email[:38]
            print(f"{email:<38} | {name:<20} | {status:<8} | {last_login:<16}")

        print("=" * 85 + "\n")


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
                    privacy_accepted=True,
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
    parser = argparse.ArgumentParser(description="Manage super admin privileges for users.")
    parser.add_argument(
        "action",
        choices=["list", "view", "ls", "add", "remove", "delete"],
        help="Action to perform (list, add, or remove)",
    )
    parser.add_argument(
        "email",
        nargs="?",
        default=None,
        help="Email of the user (required for add/remove/delete)",
    )
    args = parser.parse_args()

    if args.action in ["list", "view", "ls"]:
        asyncio.run(list_super_admins())
    else:
        if not args.email:
            print(f"❌ Error: 'email' argument is required for action '{args.action}'.")
            sys.exit(1)
        asyncio.run(manage_admin(args.email, args.action))
