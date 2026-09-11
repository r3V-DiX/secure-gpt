# backend/app/api/v1/admin/audit.py
import logging
import csv
import io
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import DBSession, CurrentUser, has_permission
from app.core.response import success
from app.models.user import User
from app.models.auth_event import AuthEvent
from app.models.rbac import AdminAuditLog

logger = logging.getLogger(__name__)
router = APIRouter(tags=["admin-audit"])


@router.get(
    "/system-logs",
    response_model=dict,
    summary="Get all administrative system changes logs",
    dependencies=[has_permission("audit:view_all")]
)
async def list_system_logs(current_user: CurrentUser, db: DBSession):
    stmt = select(AdminAuditLog)
    if current_user.org_id:
        stmt = stmt.join(User, AdminAuditLog.user_id == User.id, isouter=True).where(
            (User.org_id == current_user.org_id) | (AdminAuditLog.user_id == current_user.id)
        )
    stmt = stmt.order_by(AdminAuditLog.created_at.desc())
    
    res = await db.execute(stmt)
    logs_list = res.scalars().all()

    data = []
    for log in logs_list:
        data.append({
            "id": log.id,
            "userId": log.user_id,
            "userEmail": log.user_email,
            "userName": log.user_name,
            "userRoles": log.user_roles,
            "action": log.action,
            "module": log.module.value,
            "description": log.description,
            "entityId": log.entity_id,
            "entityType": log.entity_type,
            "entityName": log.entity_name,
            "beforeState": log.before_state,
            "afterState": log.after_state,
            "ipAddress": log.ip_address,
            "userAgent": log.user_agent,
            "status": log.status.value,
            "reason": log.reason,
            "riskLevel": log.risk_level.value,
            "createdAt": log.created_at
        })

    return success(data=data, message="System logs fetched successfully")


@router.get(
    "/audit-logs",
    summary="Get all authentication audit logs (who logged and when)",
    dependencies=[has_permission("audit:view_all")]
)
async def list_audit_logs(current_user: CurrentUser, db: DBSession):
    stmt = (
        select(AuthEvent)
        .options(selectinload(AuthEvent.user))
    )
    
    if current_user.org_id:
        stmt = stmt.join(User, AuthEvent.user_id == User.id, isouter=True).where(
            User.org_id == current_user.org_id
        )

    stmt = stmt.order_by(AuthEvent.created_at.desc())
    res = await db.execute(stmt)
    events = res.scalars().all()

    data = []
    for event in events:
        email = event.user.email if event.user else (event.event_metadata.get("email") if event.event_metadata else None)
        full_name = event.user.full_name if event.user else None
        data.append({
            "id": event.id,
            "userId": event.user_id,
            "userEmail": email or "System/Unknown",
            "userName": full_name or "Unknown",
            "eventType": event.event_type.value,
            "success": event.success,
            "userAgent": event.user_agent,
            "fingerprintHash": event.fingerprint_hash,
            "metadata": event.event_metadata,
            "createdAt": event.created_at
        })

    return success(data=data, message="System audit logs fetched successfully")


@router.get(
    "/audit-logs/export",
    summary="Export authentication audit logs as CSV for training ML model",
    dependencies=[has_permission("audit:view_all")]
)
async def export_audit_logs(current_user: CurrentUser, db: DBSession):
    stmt = (
        select(AuthEvent)
        .options(selectinload(AuthEvent.user))
    )

    if current_user.org_id:
        stmt = stmt.join(User, AuthEvent.user_id == User.id, isouter=True).where(
            User.org_id == current_user.org_id
        )

    stmt = stmt.order_by(AuthEvent.created_at.desc())
    res = await db.execute(stmt)
    events = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "User ID", "User Email", "User Name", "Event Type",
        "Success", "User Agent", "Fingerprint Hash", "Metadata", "Timestamp"
    ])
    for event in events:
        email = event.user.email if event.user else (event.event_metadata.get("email") if event.event_metadata else None)
        full_name = event.user.full_name if event.user else None
        writer.writerow([
            event.id,
            event.user_id or "",
            email or "System/Unknown",
            full_name or "Unknown",
            event.event_type.value,
            event.success,
            event.user_agent or "",
            event.fingerprint_hash or "",
            str(event.event_metadata) if event.event_metadata else "",
            event.created_at.isoformat()
        ])

    output.seek(0)
    filename = f"system_auth_audit_logs_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
