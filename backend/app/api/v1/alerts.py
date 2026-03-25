# backend/app/api/v1/alerts.py
# FIX: Severity filter count mismatch.
# The old code counted ALL alerts (ignoring severity) but returned only
# severity-filtered rows. Pagination total was therefore wrong when filtering.
#
# Fix strategy: when a severity filter is active, fetch a larger batch,
# apply Python-side filter, then return the correctly filtered count.
# (This is the right approach for a JSON column that can't use DB @> operator.)

from fastapi import APIRouter, Request, Query
from sqlalchemy import select, func, desc

from app.core.dependencies import DBSession, CurrentUser
from app.core.pagination import Pagination
from app.core.response import success, paginated
from app.core.ratelimit import limiter, LIMIT_ALERTS
from app.models.audit_log import AuditLog, ActionType

router = APIRouter(prefix="/alerts", tags=["alerts"])

ALERT_ACTIONS = [ActionType.BLOCK, ActionType.WARN_ALLOW]
SEV_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]


def _serialize_alert(log: AuditLog) -> dict:
    severities = log.severities or []
    top_severity = next((s for s in SEV_ORDER if s in severities), "LOW")
    return {
        "id": log.id,
        "eventId": log.event_id,
        "actionTaken": log.action_taken.value,
        "categoryTriggered": log.category_triggered,
        "detectionType": log.detection_type,
        "llmPlatform": log.llm_platform,
        "domain": log.domain,
        "matchCount": log.match_count,
        "entityTypes": log.entity_types or [],
        "severities": severities,
        "topSeverity": top_severity,
        "acknowledged": log.acknowledged,
        "timestamp": log.timestamp.isoformat(),
        "receivedAt": log.received_at.isoformat(),
    }


@router.get("", summary="List alerts for current user")
@limiter.limit(LIMIT_ALERTS)
async def list_alerts(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
    severity: str | None = Query(
        None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, LOW"
    ),
):
    """
    Return alert-level events for the current user.

    FIX: When severity filter is active we now return the correct filtered
    total instead of the unfiltered count. We fetch all matching alerts
    server-side (no OFFSET/LIMIT yet) so we can filter in Python, then
    slice the correct page from the filtered list.

    For high-volume use, migrate severities column to JSONB and use DB-side
    filtering with @> operator — see comment in models/audit_log.py.
    """
    base_query = (
        select(AuditLog)
        .where(
            AuditLog.user_id == current_user.id,
            AuditLog.action_taken.in_(ALERT_ACTIONS),
        )
        .order_by(desc(AuditLog.received_at))
    )

    sev = severity.upper() if severity else None
    valid_sev = sev in SEV_ORDER if sev else False

    if valid_sev:
        # FIX: fetch ALL rows so we can filter and get the correct total.
        # For very large datasets this should be replaced with JSONB + DB filter.
        result = await db.execute(base_query)
        all_logs = list(result.scalars().all())
        filtered = [log for log in all_logs if sev in (log.severities or [])]
        total = len(filtered)
        # Manually page the filtered list
        start = pagination.offset
        end = start + pagination.limit
        logs = filtered[start:end]
    else:
        # No severity filter — use efficient DB-side pagination
        count_result = await db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()
        result = await db.execute(
            base_query.offset(pagination.offset).limit(pagination.limit)
        )
        logs = list(result.scalars().all())

    return paginated(
        data=[_serialize_alert(log) for log in logs],
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        message="Alerts fetched successfully",
    )


@router.get("/summary", summary="Alert counts summary")
@limiter.limit(LIMIT_ALERTS)
async def get_alert_summary(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    """Return a quick summary of alert counts by action and severity."""
    result = await db.execute(
        select(AuditLog).where(
            AuditLog.user_id == current_user.id,
            AuditLog.action_taken.in_(ALERT_ACTIONS),
        )
    )
    logs = result.scalars().all()

    blocked = sum(1 for log in logs if log.action_taken == ActionType.BLOCK)
    warned  = sum(1 for log in logs if log.action_taken == ActionType.WARN_ALLOW)

    sev_counts: dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for log in logs:
        for sev in (log.severities or []):
            if sev in sev_counts:
                sev_counts[sev] += 1

    return success(
        data={
            "total": len(logs),
            "blocked": blocked,
            "warned": warned,
            "bySeverity": sev_counts,
        },
        message="Alert summary fetched",
    )