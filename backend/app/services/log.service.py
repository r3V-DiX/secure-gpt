# ─────────────────────────────────────────────
# Log Service
# Audit log ingestion + querying
# ─────────────────────────────────────────────

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timezone
from app.models.audit_log import AuditLog
from app.models.device import Device
from app.core.security import hash_device_token
import uuid


def ingest_log_batch(
    db: Session,
    device_token: str,
    org_id: str,
    events: list[dict],
) -> int:
    """Validate device token and bulk insert log events."""
    # Validate device
    token_hash = hash_device_token(device_token)
    device = db.query(Device).filter(
        Device.token_hash == token_hash,
        Device.org_id == org_id,
        Device.is_active == True,
    ).first()

    if not device:
        raise ValueError("Invalid device token")

    # Update device last seen
    device.last_seen_at = datetime.now(timezone.utc)

    # Insert events
    log_objects = []
    for event in events:
        # Skip duplicate event_ids
        exists = db.query(AuditLog).filter(
            AuditLog.event_id == event["event_id"]
        ).first()
        if exists:
            continue

        log_objects.append(AuditLog(
            id=str(uuid.uuid4()),
            event_id=event["event_id"],
            timestamp=event["timestamp"],
            user_id=device.user_id,
            user_email=event.get("user_email"),
            org_id=org_id,
            department=event.get("department"),
            device_id=device.id,
            action_taken=event["action_taken"],
            category_triggered=event["category_triggered"],
            detection_type=event["detection_type"],
            detection_tier=event.get("detection_tier", "regex"),
            llm_platform=event["llm_platform"],
            match_count=event.get("match_count", 1),
            snippet_hash=event["snippet_hash"],
            extension_version=event["extension_version"],
            os_platform=event["os_platform"],
            browser=event["browser"],
            acknowledged=event.get("acknowledged", False),
        ))

    db.bulk_save_objects(log_objects)
    db.commit()
    return len(log_objects)


def get_logs(
    db: Session,
    org_id: str,
    user_id: str | None = None,
    action: str | None = None,
    category: str | None = None,
    platform: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = 1,
    limit: int = 50,
    requesting_user_role: str = "USER",
    requesting_user_id: str | None = None,
    requesting_user_dept: str | None = None,
) -> tuple[list[AuditLog], int]:
    """Fetch logs with role-based filtering."""
    query = db.query(AuditLog).filter(AuditLog.org_id == org_id)

    # Role-based access
    if requesting_user_role == "USER":
        query = query.filter(AuditLog.user_id == requesting_user_id)
    elif requesting_user_role == "HR_MANAGER":
        query = query.filter(AuditLog.department == requesting_user_dept)

    # Filters
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action_taken == action)
    if category:
        query = query.filter(AuditLog.category_triggered == category)
    if platform:
        query = query.filter(AuditLog.llm_platform == platform)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)

    total = query.count()
    logs = (
        query.order_by(desc(AuditLog.timestamp))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return logs, total


def get_log_stats(db: Session, org_id: str) -> dict:
    """Aggregate stats for dashboard KPI cards."""
    base = db.query(AuditLog).filter(AuditLog.org_id == org_id)

    total = base.count()
    blocked = base.filter(AuditLog.action_taken == "BLOCK").count()
    masked = base.filter(AuditLog.action_taken == "MASK").count()
    warned = base.filter(AuditLog.action_taken == "WARN_ALLOW").count()
    allowed = base.filter(AuditLog.action_taken == "ALLOW").count()

    top_categories = (
        db.query(AuditLog.category_triggered, func.count().label("count"))
        .filter(AuditLog.org_id == org_id)
        .group_by(AuditLog.category_triggered)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )

    top_platforms = (
        db.query(AuditLog.llm_platform, func.count().label("count"))
        .filter(AuditLog.org_id == org_id)
        .group_by(AuditLog.llm_platform)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )

    top_users = (
        db.query(AuditLog.user_id, func.count().label("count"))
        .filter(AuditLog.org_id == org_id)
        .group_by(AuditLog.user_id)
        .order_by(desc("count"))
        .limit(10)
        .all()
    )

    return {
        "total_events": total,
        "blocked_count": blocked,
        "masked_count": masked,
        "warned_count": warned,
        "allowed_count": allowed,
        "top_categories": [{"category": r[0], "count": r[1]} for r in top_categories],
        "top_platforms": [{"platform": r[0], "count": r[1]} for r in top_platforms],
        "top_users": [{"user_id": r[0], "count": r[1]} for r in top_users],
    }
