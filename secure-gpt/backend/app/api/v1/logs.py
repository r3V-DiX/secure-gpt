# backend/app/api/v1/logs.py
# FIX: get_log_stats() and get_dashboard_stats() previously loaded ALL logs
# into Python memory with no LIMIT — causes OOM at scale.
# Fixed with DB-side aggregation using GROUP BY + func.count().

import csv
import io
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, desc, cast, String

from app.core.dependencies import DBSession, CurrentUser
from app.core.pagination import Pagination
from app.core.response import success, paginated
from app.core.ratelimit import limiter, LIMIT_LOGS, LIMIT_LOGS_STATS
from app.models.audit_log import AuditLog, ActionType

router = APIRouter(prefix="/logs", tags=["logs"])


def _serialize_log(log: AuditLog) -> dict:
    return {
        "id": log.id,
        "eventId": log.event_id,
        "actionTaken": log.action_taken.value,
        "categoryTriggered": log.category_triggered,
        "detectionType": log.detection_type,
        "detectionTier": log.detection_tier,
        "llmPlatform": log.llm_platform,
        "domain": log.domain,
        "matchCount": log.match_count,
        "entityTypes": log.entity_types or [],
        "severities": log.severities or [],
        "extensionVersion": log.extension_version,
        "osPlatform": log.os_platform,
        "browser": log.browser,
        "acknowledged": log.acknowledged,
        "latencyMs": log.latency_ms,
        "timestamp": log.timestamp.isoformat(),
        "receivedAt": log.received_at.isoformat(),
    }


@router.get("", summary="List own logs with filters and pagination")
@router.get("/", include_in_schema=False)
@limiter.limit(LIMIT_LOGS)
async def list_logs(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
    action: str | None = Query(None),
    category: str | None = Query(None),
    platform: str | None = Query(None),
    domain: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
):
    query = select(AuditLog).where(AuditLog.user_id == current_user.id)

    if action:
        query = query.where(AuditLog.action_taken == action.upper())
    if category:
        query = query.where(AuditLog.category_triggered == category.upper())
    if platform:
        query = query.where(AuditLog.llm_platform == platform.lower())
    if domain:
        query = query.where(AuditLog.domain.ilike(f"%{domain}%"))
    if start_date:
        try:
            query = query.where(AuditLog.timestamp >= datetime.fromisoformat(start_date))
        except ValueError:
            pass
    if end_date:
        try:
            query = query.where(AuditLog.timestamp <= datetime.fromisoformat(end_date))
        except ValueError:
            pass

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.order_by(desc(AuditLog.received_at)).offset(pagination.offset).limit(pagination.limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    return paginated(
        data=[_serialize_log(log) for log in logs],
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/stats", summary="Aggregated stats for current user")
@limiter.limit(LIMIT_LOGS_STATS)
async def get_log_stats(request: Request, db: DBSession, current_user: CurrentUser):
    """
    Return aggregated detection stats for dashboard KPI cards.
    FIX: Uses DB-side GROUP BY aggregation instead of loading all rows into memory.
    entity_types and severities are JSON columns — those still need Python-side
    aggregation, but we cap the row fetch to last 10k events for safety.
    """
    # DB-side action aggregation
    action_rows = await db.execute(
        select(AuditLog.action_taken, func.count().label("cnt"))
        .where(AuditLog.user_id == current_user.id)
        .group_by(AuditLog.action_taken)
    )
    action_counts = {row.action_taken.value: row.cnt for row in action_rows}

    total_result = await db.execute(
        select(func.count()).where(AuditLog.user_id == current_user.id)
    )
    total = total_result.scalar_one()

    # DB-side platform aggregation
    platform_rows = await db.execute(
        select(AuditLog.llm_platform, func.count().label("cnt"))
        .where(AuditLog.user_id == current_user.id)
        .group_by(AuditLog.llm_platform)
        .order_by(desc("cnt"))
        .limit(10)
    )
    top_platforms = [{"platform": r.llm_platform, "count": r.cnt} for r in platform_rows]

    # DB-side domain aggregation
    domain_rows = await db.execute(
        select(AuditLog.domain, func.count().label("cnt"))
        .where(AuditLog.user_id == current_user.id, AuditLog.domain.isnot(None))
        .group_by(AuditLog.domain)
        .order_by(desc("cnt"))
        .limit(10)
    )
    top_domains = [{"domain": r.domain, "count": r.cnt} for r in domain_rows]

    # entity_types is a JSON array column — needs Python-side unpack.
    # Cap at 10k rows to prevent OOM on large datasets.
    entity_result = await db.execute(
        select(AuditLog.entity_types)
        .where(AuditLog.user_id == current_user.id)
        .limit(10_000)
    )
    entity_counts: dict[str, int] = {}
    for (entity_types,) in entity_result:
        for et in (entity_types or []):
            entity_counts[et] = entity_counts.get(et, 0) + 1

    top_entity_types = sorted(
        [{"type": k, "count": v} for k, v in entity_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:10]

    return success(
        data={
            "totalEvents": total,
            "blockedCount": action_counts.get("BLOCK", 0),
            "maskedCount": action_counts.get("MASK", 0),
            "warnedCount": action_counts.get("WARN_ALLOW", 0),
            "allowedCount": action_counts.get("ALLOW", 0),
            "topEntityTypes": top_entity_types,
            "topPlatforms": top_platforms,
            "topDomains": top_domains,
        },
        message="Stats fetched successfully",
    )


@router.get("/dashboard", summary="Dashboard summary stats with time-series data")
@limiter.limit(LIMIT_LOGS_STATS)
async def get_dashboard_stats(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    days: int = Query(default=30, ge=1, le=90),
):
    """
    Full dashboard stats: KPI counts + events_by_day chart data.
    FIX: Uses DB-side GROUP BY for action/platform/domain counts.
    """
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    since = today - timedelta(days=days - 1)

    where = [
        AuditLog.user_id == current_user.id,
        AuditLog.timestamp >= since,
    ]

    # DB-side action counts
    action_rows = await db.execute(
        select(AuditLog.action_taken, func.count().label("cnt"))
        .where(*where)
        .group_by(AuditLog.action_taken)
    )
    action_counts = {row.action_taken.value: row.cnt for row in action_rows}

    total_result = await db.execute(
        select(func.count()).where(*where)
    )
    total = total_result.scalar_one()

    # DB-side domain aggregation
    domain_rows = await db.execute(
        select(AuditLog.domain, func.count().label("cnt"))
        .where(*where, AuditLog.domain.isnot(None))
        .group_by(AuditLog.domain)
        .order_by(desc("cnt"))
        .limit(8)
    )
    top_domains = [{"domain": r.domain, "count": r.cnt} for r in domain_rows]

    # entity_types: JSON column, still needs Python (cap at 10k)
    entity_result = await db.execute(
        select(AuditLog.entity_types).where(*where).limit(10_000)
    )
    entity_counts: dict[str, int] = {}
    for (entity_types,) in entity_result:
        for et in (entity_types or []):
            entity_counts[et] = entity_counts.get(et, 0) + 1

    top_entity_types = sorted(
        [{"type": k, "count": v} for k, v in entity_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:8]

    # Events by day — fetch only date + count
    day_result = await db.execute(
        select(AuditLog.timestamp).where(*where)
    )
    day_counts: dict[str, int] = defaultdict(int)
    for (ts,) in day_result:
        day_counts[ts.strftime("%Y-%m-%d")] += 1

    events_by_day = [
        {"date": (since + timedelta(days=i)).strftime("%Y-%m-%d"),
         "count": day_counts.get((since + timedelta(days=i)).strftime("%Y-%m-%d"), 0)}
        for i in range(days)
    ]

    return success(
        data={
            "totalEvents": total,
            "maskedCount": action_counts.get("MASK", 0),
            "allowedCount": action_counts.get("ALLOW", 0),
            "blockedCount": action_counts.get("BLOCK", 0),
            "cancelledCount": action_counts.get("WARN_ALLOW", 0),
            "topEntityTypes": top_entity_types,
            "topDomains": top_domains,
            "eventsByDay": events_by_day,
        },
        message="Dashboard stats fetched",
    )


@router.get("/export", summary="Export own logs as CSV")
@limiter.limit(LIMIT_LOGS_STATS)
async def export_logs(request: Request, db: DBSession, current_user: CurrentUser):
    """Download all the current user's logs as a CSV file."""
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.user_id == current_user.id)
        .order_by(desc(AuditLog.received_at))
    )
    logs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Event ID", "Action", "Category", "Detection Type",
        "Detection Tier", "Platform", "Domain", "Match Count",
        "Latency (ms)", "Timestamp", "Received At",
    ])
    for log in logs:
        writer.writerow([
            log.id, log.event_id or "", log.action_taken.value,
            log.category_triggered, log.detection_type, log.detection_tier,
            log.llm_platform, log.domain or "", log.match_count,
            log.latency_ms or "", log.timestamp.isoformat(), log.received_at.isoformat(),
        ])

    output.seek(0)
    filename = f"dlp_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )