# ─────────────────────────────────────────────
# Logs Routes
# Audit log ingestion + querying
# ─────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_auditor
from app.services.log.service import ingest_log_batch, get_logs, get_log_stats
from app.models.user import User
import math

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.post("/batch")
def ingest_batch(
    payload: dict,
    db: Session = Depends(get_db),
) -> dict:
    """Extension calls this to submit a batch of audit log events.
    Authenticated via device token (not user JWT)."""
    try:
        count = ingest_log_batch(
            db,
            device_token=payload["device_token"],
            org_id=payload["org_id"],
            events=payload["events"],
        )
        return {
            "success": True,
            "data": {"received": count, "message": f"{count} events logged"},
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/")
def list_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    user_id: str | None = Query(default=None),
    action: str | None = Query(default=None),
    category: str | None = Query(default=None),
    platform: str | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    current_user: User = Depends(require_auditor),
    db: Session = Depends(get_db),
) -> dict:
    """List audit logs with role-based access control."""
    logs, total = get_logs(
        db,
        org_id=current_user.org_id,
        user_id=user_id,
        action=action,
        category=category,
        platform=platform,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit,
        requesting_user_role=current_user.role,
        requesting_user_id=current_user.id,
        requesting_user_dept=current_user.department,
    )

    return {
        "success": True,
        "data": [
            {
                "id": log.id,
                "event_id": log.event_id,
                "timestamp": log.timestamp.isoformat(),
                "user_id": log.user_id,
                "user_email": log.user_email,
                "department": log.department,
                "action_taken": log.action_taken,
                "category_triggered": log.category_triggered,
                "detection_type": log.detection_type,
                "detection_tier": log.detection_tier,
                "llm_platform": log.llm_platform,
                "match_count": log.match_count,
                "extension_version": log.extension_version,
                "os_platform": log.os_platform,
                "browser": log.browser,
                "acknowledged": log.acknowledged,
            }
            for log in logs
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": math.ceil(total / limit),
            "has_next": page * limit < total,
            "has_prev": page > 1,
        },
    }


@router.get("/stats")
def get_stats(
    current_user: User = Depends(require_auditor),
    db: Session = Depends(get_db),
) -> dict:
    """Get aggregate stats for dashboard KPI cards."""
    stats = get_log_stats(db, current_user.org_id)
    return {"success": True, "data": stats}


@router.get("/my")
def get_my_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Users see only their own logs."""
    logs, total = get_logs(
        db,
        org_id=current_user.org_id,
        page=page,
        limit=limit,
        requesting_user_role="USER",
        requesting_user_id=current_user.id,
    )

    return {
        "success": True,
        "data": [
            {
                "event_id": log.event_id,
                "timestamp": log.timestamp.isoformat(),
                "action_taken": log.action_taken,
                "category_triggered": log.category_triggered,
                "detection_type": log.detection_type,
                "llm_platform": log.llm_platform,
                "match_count": log.match_count,
            }
            for log in logs
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": math.ceil(total / limit),
        },
    }
