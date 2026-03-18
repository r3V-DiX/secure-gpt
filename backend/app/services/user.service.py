# ─────────────────────────────────────────────
# User Service
# User management + profile
# ─────────────────────────────────────────────

from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.user import User
from datetime import datetime, timezone
import math


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_users_by_org(
    db: Session,
    org_id: str,
    page: int = 1,
    limit: int = 50,
    search: str | None = None,
    role: str | None = None,
) -> tuple[list[User], int]:
    """List all users in an org with pagination."""
    query = db.query(User).filter(User.org_id == org_id)

    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = (
        query.order_by(desc(User.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return users, total


def update_user_profile(
    db: Session,
    user_id: str,
    name: str | None = None,
    department: str | None = None,
    avatar_url: str | None = None,
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    if name is not None:
        user.name = name
    if department is not None:
        user.department = department
    if avatar_url is not None:
        user.avatar_url = avatar_url

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def update_user_role(db: Session, user_id: str, role: str) -> User:
    """Admin-only: change a user's role."""
    valid_roles = ["SUPER_ADMIN", "SECURITY_ADMIN", "AUDITOR", "HR_MANAGER", "USER"]
    if role not in valid_roles:
        raise ValueError(f"Invalid role: {role}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    user.role = role
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    user.is_active = False
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def update_last_seen(db: Session, user_id: str) -> None:
    db.query(User).filter(User.id == user_id).update(
        {"last_seen_at": datetime.now(timezone.utc)}
    )
    db.commit()


def get_high_risk_users(
    db: Session,
    org_id: str,
    threshold: int = 5,
    window_days: int = 7,
) -> list[dict]:
    """Find users who exceeded block threshold in the past N days."""
    from sqlalchemy import func, text
    from app.models.audit_log import AuditLog
    from datetime import timedelta

    since = datetime.now(timezone.utc) - timedelta(days=window_days)

    results = (
        db.query(
            AuditLog.user_id,
            func.count(AuditLog.id).label("block_count"),
        )
        .filter(
            AuditLog.org_id == org_id,
            AuditLog.action_taken == "BLOCK",
            AuditLog.timestamp >= since,
        )
        .group_by(AuditLog.user_id)
        .having(func.count(AuditLog.id) >= threshold)
        .all()
    )

    high_risk = []
    for user_id, block_count in results:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            high_risk.append({
                "user_id": user_id,
                "email": user.email,
                "name": user.name,
                "department": user.department,
                "block_count": block_count,
                "window_days": window_days,
            })

    return high_risk
