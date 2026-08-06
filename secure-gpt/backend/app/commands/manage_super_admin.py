import argparse
import asyncio
import sys

from app.core.database import AsyncSessionLocal
from app.models.rbac import Role, UserRoleAssignment
from app.models.user import User, UserRole
from sqlalchemy import select


async def manage_admin(email: str, action: str):
    async with AsyncSessionLocal() as session:
        # Get user
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f"❌ Error: User with email '{email}' not found.")
            sys.exit(1)

        # Get super_admin role
        result = await session.execute(select(Role).where(Role.slug == "super_admin"))
        super_admin_role = result.scalar_one_or_none()
        if not super_admin_role:
            print("❌ Error: 'super_admin' role not found in DB. Have you run seed_rbac.py?")
            sys.exit(1)
            
        # Get standard user role
        result = await session.execute(select(Role).where(Role.slug == "user"))
        standard_role = result.scalar_one_or_none()

        if action == "add":
            if user.role == UserRole.SUPER_ADMIN:
                print(f"ℹ️ User '{email}' is already a super admin.")
                return

            # Update legacy role column
            user.role = UserRole.SUPER_ADMIN
            
            # Clear existing assignments
            await session.execute(
                UserRoleAssignment.__table__.delete().where(UserRoleAssignment.user_id == user.id)
            )
            # Create new super admin assignment
            assignment = UserRoleAssignment(user_id=user.id, role_id=super_admin_role.id, is_active=True)
            session.add(assignment)
            
            await session.commit()
            print(f"✅ Successfully granted Super Admin rights to '{email}'.")
            
        elif action in ["delete", "remove"]:
            if user.role != UserRole.SUPER_ADMIN:
                print(f"ℹ️ User '{email}' is not a super admin.")
                return

            # Downgrade to standard user
            user.role = UserRole.USER
            
            # Clear existing assignments
            await session.execute(
                UserRoleAssignment.__table__.delete().where(UserRoleAssignment.user_id == user.id)
            )
            # Assign standard user role
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
