# backend/app/api/v1/incidents.py
# ─────────────────────────────────────────────────────────────────────────────
# Enterprise DLP Incident Auditing & Real-Time Violation Stream Endpoints
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timezone
from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy import select, func, desc

from app.core.dependencies import CurrentUser, DBSession, has_permission, require_roles
from app.core.response import success, paginated
from app.core.pagination import Pagination
from app.core.exceptions import BadRequest, NotFound, Forbidden

from app.models.dlp_incident import DLPIncident
from app.models.policy import Policy, PolicyAction
from app.models.user import User, UserRole

from app.schemas.org_schema import (
    DLPIncidentCreateRequest,
    DLPIncidentResponse,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("", summary="Record a DLP prompt violation incident from Chrome Extension", status_code=201)
async def record_incident(body: DLPIncidentCreateRequest, db: DBSession, current_user: CurrentUser):
    """
    Called in real-time when the extension detects a prompt violation.
    Records the redacted snippet, action taken, and target LLM app.
    """
    if not current_user.org_id:
        # Standalone users can operate locally without centralized incident logging
        return success(data={"status": "skipped_standalone_user"}, message="Incident not logged for standalone user")

    incident = DLPIncident(
        org_id=current_user.org_id,
        department_id=current_user.department_id,
        user_id=current_user.id,
        policy_id=body.policy_id,
        target_app=body.target_app,
        action_taken=body.action_taken,
        severity=body.severity,
        redacted_snippet=body.redacted_snippet,
        override_reason=body.override_reason,
    )
    db.add(incident)
    await db.flush()
    await db.refresh(incident)

    return success(
        data={
            "id": incident.id,
            "org_id": incident.org_id,
            "department_id": incident.department_id,
            "action_taken": incident.action_taken,
            "created_at": incident.created_at.isoformat(),
        },
        message="DLP Incident recorded successfully.",
    )


@router.get("", summary="List Org DLP Incident Stream with pagination and filters")
async def list_incidents(
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
    department_id: str | None = None,
    severity: str | None = None,
):
    """
    List violation incidents for Org Admins or Department Admins.
    Department Admins can only view incidents for their own category.
    """
    if not current_user.org_id:
        raise Forbidden("Must be an organization member to view incident logs.")

    query = select(DLPIncident).where(DLPIncident.org_id == current_user.org_id)

    # If user is a Department Admin, restrict to their department only
    if current_user.role == UserRole.DEPARTMENT_ADMIN:
        query = query.where(DLPIncident.department_id == current_user.department_id)
    elif department_id:
        query = query.where(DLPIncident.department_id == department_id)

    if severity:
        query = query.where(DLPIncident.severity == severity.upper())

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    res = await db.execute(
        query.order_by(desc(DLPIncident.created_at))
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    incidents = res.scalars().all()

    incident_list = []
    for inc in incidents:
        # Fetch user email
        u_res = await db.execute(select(User.email).where(User.id == inc.user_id))
        user_email = u_res.scalar_one_or_none() or "Unknown"

        # Fetch policy name
        p_res = await db.execute(select(Policy.name).where(Policy.id == inc.policy_id))
        policy_name = p_res.scalar_one_or_none() or "Enterprise DLP Rule"

        incident_list.append({
            "id": inc.id,
            "org_id": inc.org_id,
            "department_id": inc.department_id,
            "user_id": inc.user_id,
            "user_email": user_email,
            "policy_id": inc.policy_id,
            "policy_name": policy_name,
            "target_app": inc.target_app,
            "action_taken": inc.action_taken,
            "severity": inc.severity,
            "redacted_snippet": inc.redacted_snippet,
            "override_reason": inc.override_reason,
            "created_at": inc.created_at.isoformat(),
        })

    return paginated(
        data=incident_list,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )
