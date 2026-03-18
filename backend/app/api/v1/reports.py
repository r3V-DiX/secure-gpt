# ─────────────────────────────────────────────
# Reports Routes
# CSV + PDF export
# ─────────────────────────────────────────────

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import require_security_admin
from app.services.report.service import generate_csv_report, generate_pdf_report
from app.models.user import User
from app.models.org import Org

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/export/csv")
def export_csv(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> Response:
    """Export audit logs as CSV."""
    csv_bytes = generate_csv_report(
        db,
        org_id=current_user.org_id,
        start_date=start_date,
        end_date=end_date,
    )
    filename = f"securegpt-audit-{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/pdf")
def export_pdf(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> Response:
    """Export summary report as PDF."""
    org = db.query(Org).filter(Org.id == current_user.org_id).first()
    org_name = org.name if org else "Organisation"

    pdf_bytes = generate_pdf_report(
        db,
        org_id=current_user.org_id,
        org_name=org_name,
        start_date=start_date,
        end_date=end_date,
    )
    filename = f"securegpt-report-{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
