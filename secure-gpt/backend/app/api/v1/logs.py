# backend/app/api/v1/logs.py
import csv
import io
from datetime import datetime, timedelta, timezone

from app.core.dependencies import CurrentUser, DBSession
from app.core.pagination import Pagination
from app.core.ratelimit import LIMIT_LOGS, LIMIT_LOGS_STATS, limiter
from app.core.response import paginated, success
from app.models.audit_log import AuditLog
from app.models.user import User
from app.api.v1.log_analytics import (
    check_is_super_admin,
    aggregate_dashboard_metrics,
    fetch_leaderboards,
)
from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func, or_, select

router = APIRouter(prefix="/event-logs", tags=["logs"])


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
        query = query.where(AuditLog.action_taken == action)
    if category:
        query = query.where(AuditLog.category_triggered == category)
    if platform:
        query = query.where(AuditLog.llm_platform.ilike(f"%{platform}%"))
    if domain:
        query = query.where(AuditLog.domain.ilike(f"%{domain}%"))
    if start_date:
        query = query.where(AuditLog.timestamp >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.where(AuditLog.timestamp <= datetime.fromisoformat(end_date))

    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar_one()

    query = (
        query.order_by(desc(AuditLog.received_at))
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    result = await db.execute(query)
    logs = result.scalars().all()

    return paginated(
        data=[_serialize_log(log) for log in logs],
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/stats", summary="Get aggregated stats for the current user's logs")
@limiter.limit(LIMIT_LOGS_STATS)
async def get_log_stats(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    user_filter = AuditLog.user_id == current_user.id

    action_rows = await db.execute(
        select(AuditLog.action_taken, func.count().label("cnt"))
        .where(user_filter)
        .group_by(AuditLog.action_taken)
    )
    action_counts = {row.action_taken.value: row.cnt for row in action_rows}

    total_result = await db.execute(select(func.count()).where(user_filter))
    total = total_result.scalar_one()

    platform_rows = await db.execute(
        select(AuditLog.llm_platform, func.count().label("cnt"))
        .where(user_filter, AuditLog.llm_platform.isnot(None))
        .group_by(AuditLog.llm_platform)
        .order_by(desc("cnt"))
        .limit(10)
    )
    top_platforms = [{"platform": r.llm_platform, "count": r.cnt} for r in platform_rows]

    domain_rows = await db.execute(
        select(AuditLog.domain, func.count().label("cnt"))
        .where(user_filter, AuditLog.domain.isnot(None))
        .group_by(AuditLog.domain)
        .order_by(desc("cnt"))
        .limit(10)
    )
    top_domains = [{"domain": r.domain, "count": r.cnt} for r in domain_rows]

    entity_result = await db.execute(
        select(AuditLog.entity_types).where(user_filter).limit(10_000)
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
            "cancelledCount": action_counts.get("WARN_ALLOW", 0),
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
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    since = today - timedelta(days=days - 1)

    is_impersonation = getattr(request.state, "is_impersonation", False)
    is_super_admin = False if is_impersonation else await check_is_super_admin(db, current_user)
    role_str = "org_admin" if is_impersonation else (current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)).lower()

    if is_super_admin:
        role_scope = "platform"
        where = [AuditLog.timestamp >= since]
    elif current_user.org_id:
        role_scope = "organization"
        where = [
            or_(
                AuditLog.org_id == current_user.org_id,
                AuditLog.user_id == current_user.id,
                AuditLog.user_id.in_(select(User.id).where(User.org_id == current_user.org_id)),
            ),
            AuditLog.timestamp >= since,
        ]
    else:
        role_scope = "organization"
        where = [
            AuditLog.user_id == current_user.id,
            AuditLog.timestamp >= since,
        ]

    action_counts, total, top_domains, top_entity_types, events_by_day = await aggregate_dashboard_metrics(
        db, where, since, days
    )
    top_orgs, top_emps, top_depts = await fetch_leaderboards(db, current_user, is_super_admin, since, role_str)

    return success(
        data={
            "roleScope": role_scope,
            "totalEvents": total,
            "maskedCount": action_counts.get("MASK", 0),
            "allowedCount": action_counts.get("ALLOW", 0),
            "blockedCount": action_counts.get("BLOCK", 0),
            "warnedCount": action_counts.get("WARN_ALLOW", 0),
            "cancelledCount": action_counts.get("WARN_ALLOW", 0),
            "topEntityTypes": top_entity_types,
            "topDomains": top_domains,
            "eventsByDay": events_by_day,
            "topOrganizations": top_orgs,
            "topEmployees": top_emps,
            "topDepartments": top_depts,
        },
        message="Dashboard stats fetched",
    )


@router.get("/export", summary="Export own logs as CSV")
@limiter.limit(LIMIT_LOGS_STATS)
async def export_logs(request: Request, db: DBSession, current_user: CurrentUser):
    result = await db.execute(
        select(AuditLog).where(AuditLog.user_id == current_user.id).order_by(desc(AuditLog.received_at))
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