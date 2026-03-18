# ─────────────────────────────────────────────
# Alert Service
# High-risk user detection + email alerts
# ─────────────────────────────────────────────

from sqlalchemy.orm import Session
from app.services.user.service import get_high_risk_users
from app.models.org import Org
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def check_and_send_alerts(db: Session, org_id: str) -> list[dict]:
    """Check for high-risk users and send alerts to org admin."""
    org = db.query(Org).filter(Org.id == org_id).first()
    if not org:
        return []

    high_risk_users = get_high_risk_users(
        db,
        org_id=org_id,
        threshold=org.high_risk_threshold,
        window_days=org.high_risk_window_days,
    )

    if not high_risk_users:
        return []

    # Send email alert
    try:
        _send_alert_email(
            to_email=org.admin_email,
            org_name=org.name,
            high_risk_users=high_risk_users,
            threshold=org.high_risk_threshold,
            window_days=org.high_risk_window_days,
        )
    except Exception as e:
        logger.error(f"Failed to send alert email for org {org_id}: {e}")

    return high_risk_users


def _send_alert_email(
    to_email: str,
    org_name: str,
    high_risk_users: list[dict],
    threshold: int,
    window_days: int,
) -> None:
    """Send high-risk alert via SendGrid."""
    if not settings.SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured — skipping email alert")
        return

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        user_rows = "\n".join([
            f"- {u['name']} ({u['email']}): {u['block_count']} blocks"
            for u in high_risk_users
        ])

        message = Mail(
            from_email=settings.EMAIL_FROM,
            to_emails=to_email,
            subject=f"[SecureGPT Alert] High-Risk Users Detected — {org_name}",
            plain_text_content=(
                f"SecureGPT has detected users exceeding the threshold "
                f"of {threshold} blocked events in {window_days} days:\n\n"
                f"{user_rows}\n\n"
                f"Log in to your dashboard to review: https://securegpt.app"
            ),
        )

        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        sg.send(message)
        logger.info(f"Alert email sent to {to_email}")

    except ImportError:
        logger.warning("sendgrid package not installed")
    except Exception as e:
        logger.error(f"SendGrid error: {e}")
        raise
