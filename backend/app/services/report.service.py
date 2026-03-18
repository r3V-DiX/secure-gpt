# ─────────────────────────────────────────────
# Report Service
# CSV + PDF report generation
# ─────────────────────────────────────────────

import csv
import io
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.services.log.service import get_logs, get_log_stats
from app.models.audit_log import AuditLog


def generate_csv_report(
    db: Session,
    org_id: str,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> bytes:
    """Generate CSV export of audit logs."""
    logs, _ = get_logs(
        db,
        org_id=org_id,
        start_date=start_date,
        end_date=end_date,
        limit=10000,
        requesting_user_role="SUPER_ADMIN",
    )

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "event_id", "timestamp", "user_id", "user_email",
        "department", "action_taken", "category_triggered",
        "detection_type", "detection_tier", "llm_platform",
        "match_count", "extension_version", "os_platform",
        "browser", "acknowledged",
    ])
    writer.writeheader()

    for log in logs:
        writer.writerow({
            "event_id": log.event_id,
            "timestamp": log.timestamp.isoformat(),
            "user_id": log.user_id,
            "user_email": log.user_email or "",
            "department": log.department or "",
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
        })

    return output.getvalue().encode("utf-8")


def generate_pdf_report(
    db: Session,
    org_id: str,
    org_name: str,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> bytes:
    """Generate PDF summary report using ReportLab."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors

        stats = get_log_stats(db, org_id)
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph(f"SecureGPT — Audit Report", styles["Title"]))
        story.append(Paragraph(f"Organisation: {org_name}", styles["Normal"]))
        story.append(Paragraph(
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"]
        ))
        story.append(Spacer(1, 20))

        # Summary table
        summary_data = [
            ["Metric", "Count"],
            ["Total Events", str(stats["total_events"])],
            ["Blocked", str(stats["blocked_count"])],
            ["Masked", str(stats["masked_count"])],
            ["Warned", str(stats["warned_count"])],
            ["Allowed", str(stats["allowed_count"])],
        ]

        table = Table(summary_data, colWidths=[300, 100])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ]))
        story.append(table)

        doc.build(story)
        return buffer.getvalue()

    except ImportError:
        # Fall back to CSV if reportlab not installed
        return generate_csv_report(db, org_id, start_date, end_date)
