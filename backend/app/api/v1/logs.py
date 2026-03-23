# backend/app/api/v1/logs.py

import csv
import io
from datetime import datetime
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.dependencies import DBSession, CurrentUser, RequireSecurityAdmin, RequireAuditor
from app.models.audit_log import AuditLog, ActionType, SeverityLevel

router = APIRouter(prefix="/logs", tags=["logs"])


class LogCreateRequest(BaseModel):
    action: ActionType
    domain: str
    timestamp: datetime
    entity_types: list[str] = []
    severities: list[str] = []
    latency_ms: int | None = None
    pipeline_version: str | None = None

    # camelCase aliases from extension
    model_config = {"populate_by_name": True}


class LogResponse(BaseModel):
    id: str
    action: str
    domain: str
    entity_types: list[str]
    severities: list[str]
    latency_ms: int | None
    pipeline_version: str | None
    client_ip: str | None
    user_id: str | None
    org_id: str | None
    timestamp: datetime
    received_at: datetime

    model_config = {"from_attributes": True}


class LogsListResponse(BaseModel):
    total: int
    items: list[LogResponse]


@router.post("", response_model=dict, status_code=201)
async def create_log(body: LogCreateRequest, db: DBSession, current_user: CurrentUser):
    log = AuditLog(
        action=body.action,
        domain=body.domain,
        timestamp=body.timestamp,
        entity_types=body.entity_types,
        severities=body.severities,
        latency_ms=body.latency_ms,
        pipeline_version=body.pipeline_version,
        user_id=current_user.id,
        org_id=current_user.org_id,
    )
    db.add(log)
    await db.flush()
    return {"id": log.id, "status": "ok"}


@router.get("", response_model=LogsListResponse, dependencies=[RequireAuditor])
async def list_logs(
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user_id: str | None = None,
    org_id: str | None = None,
    action: ActionType | None = None,
    domain: str | None = None,
):
    query = select(AuditLog)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if org_id:
        query = query.where(AuditLog.org_id == org_id)
    if action:
        query = query.where(AuditLog.action == action)
    if domain:
        query = query.where(AuditLog.domain.ilike(f"%{domain}%"))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(AuditLog.received_at.desc())
    result = await db.execute(query)
    logs = result.scalars().all()

    return LogsListResponse(total=total, items=[LogResponse.model_validate(l) for l in logs])


@router.get("/export", dependencies=[RequireAuditor])
async def export_logs(db: DBSession):
    result = await db.execute(select(AuditLog).order_by(AuditLog.received_at.desc()))
    logs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Action", "Domain", "Entity Types", "Severities", "Latency (ms)", "User ID", "Timestamp", "Received At"])

    for log in logs:
        writer.writerow([
            log.id, log.action.value, log.domain,
            ",".join(log.entity_types), ",".join(log.severities),
            log.latency_ms or 0, log.user_id or "",
            log.timestamp.isoformat(), log.received_at.isoformat(),
        ])

    output.seek(0)
    filename = f"audit_logs_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/stats", dependencies=[RequireAuditor])
async def get_log_stats(db: DBSession, org_id: str | None = None):
    query = select(AuditLog)
    if org_id:
        query = query.where(AuditLog.org_id == org_id)

    result = await db.execute(query)
    logs = result.scalars().all()

    total = len(logs)
    masked = sum(1 for l in logs if l.action == ActionType.MASK)
    allowed = sum(1 for l in logs if l.action == ActionType.ALLOW)
    blocked = sum(1 for l in logs if l.action == ActionType.BLOCK)
    cancelled = sum(1 for l in logs if l.action == ActionType.CANCEL)

    # Entity type frequency
    entity_counts: dict[str, int] = {}
    for log in logs:
        for et in log.entity_types:
            entity_counts[et] = entity_counts.get(et, 0) + 1

    top_entities = sorted(entity_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "total": total,
        "masked": masked,
        "allowed": allowed,
        "blocked": blocked,
        "cancelled": cancelled,
        "top_entity_types": [{"type": k, "count": v} for k, v in top_entities],
    }