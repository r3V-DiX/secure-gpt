# backend/app/commands/cleanup_deleted_users.py

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update, delete
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.deleted_user_log import DeletedUserLog
from app.models.session import Session
from app.models.rbac import UserRoleAssignment
from app.models.device import Device
from app.models.audit_log import AuditLog
from app.models.auth_event import AuthEvent
from app.models.policy import Policy

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def cleanup_deleted_users():
    logger.info("Starting account deletion and inactivity policy processor...")
    now = datetime.now(timezone.utc)
    
    async with AsyncSessionLocal() as session:
        # 1. Deactivate users inactive for 3 years
        three_years_ago = now - timedelta(days=3 * 365)
        inactive_stmt = (
            select(User)
            .where(User.is_active == True)
            .where(
                (User.last_login_at.is_(None) & (User.created_at <= three_years_ago)) |
                (User.last_login_at.is_not(None) & (User.last_login_at <= three_years_ago))
            )
        )
        inactive_res = await session.execute(inactive_stmt)
        inactive_users = inactive_res.scalars().all()
        for user in inactive_users:
            user.is_active = False
            user.deactivated_at = now
            user.deactivation_reason = "inactivity"
            user.pre_deletion_email_sent = False
            logger.info(f"User {user.email} deactivated due to 3 years of inactivity.")
        
        await session.flush()

        # 2. Send pre-deletion warning emails (Day 43 of deactivation hold)
        warning_time = now - timedelta(days=43)
        warning_stmt = (
            select(User)
            .where(User.is_active == False)
            .where(User.deactivated_at.is_not(None))
            .where(User.deactivated_at <= warning_time)
            .where(User.pre_deletion_email_sent == False)
        )
        warning_res = await session.execute(warning_stmt)
        warning_users = warning_res.scalars().all()
        for user in warning_users:
            # Mock sending email by writing to logs / stdout
            print(f"[EMAIL] Pre-deletion warning sent to {user.email} (grace period ending in 48 hours)")
            user.pre_deletion_email_sent = True
            logger.info(f"Sent pre-deletion warning email to {user.email}.")
            
        await session.flush()

        # 3. Permanent purge (Day 46 of deactivation hold)
        purge_time = now - timedelta(days=46)
        purge_stmt = (
            select(User)
            .where(User.is_active == False)
            .where(User.deactivated_at.is_not(None))
            .where(User.deactivated_at <= purge_time)
        )
        purge_res = await session.execute(purge_stmt)
        purge_users = purge_res.scalars().all()
        for user in purge_users:
            logger.info(f"Permanently purging user data for ID: {user.id}")
            
            # Log legal audit record (just user ID and deletion date)
            log_record = DeletedUserLog(
                user_id=user.id,
                deleted_at=now
            )
            session.add(log_record)
            
            # Purge telemetry and logs related to the user
            await session.execute(delete(Session).where(Session.user_id == user.id))
            await session.execute(delete(UserRoleAssignment).where(UserRoleAssignment.user_id == user.id))
            await session.execute(delete(Device).where(Device.user_id == user.id))
            await session.execute(delete(AuditLog).where(AuditLog.user_id == user.id))
            await session.execute(delete(AuthEvent).where(AuthEvent.user_id == user.id))
            await session.execute(delete(Policy).where(Policy.user_id == user.id))
            
            # Purge user record itself
            await session.delete(user)
            logger.info(f"Successfully purged user {user.id} and all related logs.")

        await session.commit()
        logger.info("Policy processing completed successfully.")


if __name__ == "__main__":
    asyncio.run(cleanup_deleted_users())
