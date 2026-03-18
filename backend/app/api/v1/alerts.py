# ─────────────────────────────────────────────
# Alerts Routes
# High-risk user alerts
# ─────────────────────────────────────────────

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_security_admin
from app.services.user.service import get_high_risk_users
from app.models.user import User
from app.models.org import Org

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/high-risk")
def get_high_risk(
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Get current high-risk users for the org."""
    org = db.query(Org).filter(Org.id == current_user.org_id).first()
    users = get_high_risk_users(
        db,
        org_id=current_user.org_id,
        threshold=org.high_risk_threshold if org else 5,
        window_days=org.high_risk_window_days if org else 7,
    )
    return {"success": True, "data": users, "count": len(users)}


@router.post("/trigger-check")
def trigger_check(
    current_user: User = Depends(require_security_admin),
) -> dict:
    """Manually trigger alert check for the org (runs as Celery task)."""
    from app.workers.alert.task import check_org_alerts
    task = check_org_alerts.delay(current_user.org_id)
    return {"success": True, "data": {"task_id": task.id}, "message": "Alert check triggered"}
