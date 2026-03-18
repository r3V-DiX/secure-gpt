# ─────────────────────────────────────────────
# Report Task
# Celery tasks for report generation + log purge
# ─────────────────────────────────────────────

from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.config import settings
from datetime import datetime, timezone, timedelta
from app.models.audit_log import AuditLog
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.report.task.generate_scheduled_report")
def generate_scheduled_report(org_id: str, org_name: str, admin_email: str) -> dict:
    """Generate and email a scheduled report for an org."""
    from app.services.report.service import generate_pdf_report
    from app.core.config import settings

    db = SessionLocal()
    try:
        pdf_bytes = generate_pdf_report(db, org_id, org_name)

        # Send via SendGrid with attachment
        if settings.SENDGRID_API_KEY:
            _send_report_email(admin_email, org_name, pdf_bytes)

        return {"org_id": org_id, "status": "sent", "bytes": len(pdf_bytes)}
    except Exception as e:
        logger.error(f"Report generation failed for org {org_id}: {e}")
        return {"org_id": org_id, "status": "failed", "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.workers.report.task.purge_old_logs")
def purge_old_logs() -> dict:
    """Delete logs older than retention period for each org."""
    from app.models.org import Org

    db = SessionLocal()
    total_deleted = 0

    try:
        orgs = db.query(Org).filter(Org.is_active == True).all()
        for org in orgs:
            cutoff = datetime.now(timezone.utc) - timedelta(days=org.log_retention_days)
            deleted = (
                db.query(AuditLog)
                .filter(
                    AuditLog.org_id == org.id,
                    AuditLog.timestamp < cutoff,
                )
                .delete(synchronize_session=False)
            )
            total_deleted += deleted
        db.commit()
    finally:
        db.close()

    logger.info(f"Purged {total_deleted} old audit log entries")
    return {"deleted": total_deleted}


def _send_report_email(to_email: str, org_name: str, pdf_bytes: bytes) -> None:
    import base64
    import sendgrid
    from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition

    sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
    message = Mail(
        from_email=settings.EMAIL_FROM,
        to_emails=to_email,
        subject=f"SecureGPT — Monthly Audit Report: {org_name}",
        plain_text_content="Please find your SecureGPT audit report attached.",
    )
    encoded = base64.b64encode(pdf_bytes).decode()
    attachment = Attachment(
        FileContent(encoded),
        FileName("securegpt-report.pdf"),
        FileType("application/pdf"),
        Disposition("attachment"),
    )
    message.attachment = attachment
    sg.send(message)
