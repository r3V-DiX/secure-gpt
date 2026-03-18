# ─────────────────────────────────────────────
# Alert Task
# Celery task for high-risk user detection
# ─────────────────────────────────────────────

from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.org import Org
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.alert.task.check_all_orgs_for_alerts")
def check_all_orgs_for_alerts() -> dict:
    """Check all active orgs for high-risk users and send alerts."""
    from app.services.alert.service import check_and_send_alerts

    db = SessionLocal()
    total_alerts = 0

    try:
        orgs = db.query(Org).filter(Org.is_active == True).all()
        for org in orgs:
            try:
                flagged = check_and_send_alerts(db, org.id)
                total_alerts += len(flagged)
            except Exception as e:
                logger.error(f"Alert check failed for org {org.id}: {e}")
    finally:
        db.close()

    return {"orgs_checked": len(orgs), "total_alerts_sent": total_alerts}


@celery_app.task(name="app.workers.alert.task.check_org_alerts")
def check_org_alerts(org_id: str) -> dict:
    """Check a single org for high-risk users — triggered on demand."""
    from app.services.alert.service import check_and_send_alerts

    db = SessionLocal()
    try:
        flagged = check_and_send_alerts(db, org_id)
        return {"org_id": org_id, "flagged_users": len(flagged)}
    finally:
        db.close()
