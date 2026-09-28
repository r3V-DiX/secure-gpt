# backend/app/api/v1/policy.py
import copy
from datetime import datetime, timezone

from app.core.dependencies import CurrentUser, DBSession, has_permission
from app.core.exceptions import NotFound, BadRequest
from app.core.pagination import Pagination
from app.core.ratelimit import LIMIT_POLICY, limiter
from app.core.response import paginated, success
from app.models.policy import Policy
from app.models.rbac import PermissionModule, RiskLevel
from app.schemas.policy_schema import PolicyCreateRequest, PolicyUpdateRequest
from app.services.extension_service import push_policy_update
from app.services.rbac_service import log_admin_action
from app.api.v1.policy_helpers import (
    serialize_policy,
    get_policy_where_clause,
    create_policy_version,
)
from fastapi import APIRouter, Request
from sqlalchemy import func, select

router = APIRouter(prefix="/policy", tags=["policy"])


@router.get("/current", summary="Get current active policy")
@limiter.limit(LIMIT_POLICY)
async def get_current_policy(request: Request, db: DBSession, current_user: CurrentUser, department_id: str | None = None):
    where_clause = get_policy_where_clause(current_user.id, current_user.org_id, department_id)
    result = await db.execute(
        select(Policy)
        .where(where_clause, Policy.is_active == True)
        .order_by(Policy.version.desc())
        .limit(1)
    )
    policy = result.scalar_one_or_none()

    if not policy:
        from app.services.extension_service import DEFAULT_POLICY_CONFIG
        now = datetime.now(timezone.utc).isoformat()
        default = copy.deepcopy(DEFAULT_POLICY_CONFIG)
        default["updatedAt"] = now
        return success(
            data={
                "id": None,
                "userId": current_user.id,
                "orgId": current_user.org_id,
                "departmentId": department_id,
                "config": default,
                "version": 1,
                "isActive": True,
                "publishedAt": None,
                "createdAt": None,
                "updatedAt": now,
            },
            message="Default policy returned (no custom policy set)",
        )

    return success(data=serialize_policy(policy), message="Policy fetched")


@router.get("", summary="List all policy versions", dependencies=[has_permission("policy:view")])
@limiter.limit(LIMIT_POLICY)
async def list_policies(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
    department_id: str | None = None,
):
    if department_id and current_user.org_id:
        where_clause = (Policy.org_id == current_user.org_id) & (Policy.department_id == department_id)
    elif current_user.org_id:
        where_clause = (Policy.org_id == current_user.org_id)
    else:
        where_clause = (Policy.user_id == current_user.id)

    count_result = await db.execute(
        select(func.count()).select_from(
            select(Policy).where(where_clause).subquery()
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Policy)
        .where(where_clause)
        .order_by(Policy.version.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    policies = result.scalars().all()

    return paginated(
        data=[serialize_policy(p) for p in policies],
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.post("", summary="Create a new policy version", status_code=201, dependencies=[has_permission("policy:create")])
@limiter.limit(LIMIT_POLICY)
async def create_policy(
    request: Request,
    body: PolicyCreateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    dept_id = body.department_id if current_user.org_id else None
    where_clause = get_policy_where_clause(current_user.id, current_user.org_id, dept_id)

    old_res = await db.execute(
        select(Policy).where(where_clause, Policy.is_active == True).order_by(Policy.version.desc()).limit(1)
    )
    old_policy = old_res.scalar_one_or_none()
    old_config = old_policy.config if old_policy else None

    policy = await create_policy_version(
        db, current_user.id, current_user.org_id, dept_id, body.config.model_dump(), body.publishImmediately
    )

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="policy:create",
        module=PermissionModule.POLICY,
        description=f"Created DLP policy version {policy.version}",
        entity_id=policy.id,
        entity_type="Policy",
        entity_name=f"v{policy.version}",
        before_state={"config": old_config} if old_config else None,
        after_state={"config": policy.config},
        risk_level=RiskLevel.HIGH
    )

    await db.commit()
    await push_policy_update(current_user.id, current_user.org_id, {
        "version": policy.version,
        "config": policy.config,
        "updatedAt": policy.updated_at.isoformat(),
    })
    return success(data=serialize_policy(policy), message="Policy created successfully")


@router.put("/current", summary="Update the active policy (creates new version)", dependencies=[has_permission("policy:update")])
@limiter.limit(LIMIT_POLICY)
async def update_policy(
    request: Request,
    body: PolicyUpdateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    dept_id = body.department_id if current_user.org_id else None

    if current_user.org_id:
        from app.models.org import Organisation, OrgStatus
        org_res = await db.execute(select(Organisation).where(Organisation.id == current_user.org_id))
        org = org_res.scalar_one_or_none()
        if org and org.status != OrgStatus.ACTIVE and not org.domain_verified_at:
            builtin_cats = {'FINANCIAL', 'PII', 'CONFIDENTIAL', 'IP'}
            requested_cats = set(body.config.categories.keys())
            if not requested_cats.issubset(builtin_cats):
                raise BadRequest(
                    message=f"Domain verification required: You cannot create new custom categories until '{org.domain}' is verified via DNS TXT record."
                )

    where_clause = get_policy_where_clause(current_user.id, current_user.org_id, dept_id)
    old_res = await db.execute(
        select(Policy).where(where_clause, Policy.is_active == True).order_by(Policy.version.desc()).limit(1)
    )
    old_policy = old_res.scalar_one_or_none()
    old_config = old_policy.config if old_policy else None

    policy = await create_policy_version(
        db, current_user.id, current_user.org_id, dept_id, body.config.model_dump(), body.publishImmediately
    )

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="policy:update",
        module=PermissionModule.POLICY,
        description=f"Updated DLP policy to version {policy.version}",
        entity_id=policy.id,
        entity_type="Policy",
        entity_name=f"v{policy.version}",
        before_state={"config": old_config} if old_config else None,
        after_state={"config": policy.config},
        risk_level=RiskLevel.HIGH
    )

    await db.commit()
    await push_policy_update(current_user.id, current_user.org_id, {
        "version": policy.version,
        "config": policy.config,
        "updatedAt": policy.updated_at.isoformat(),
    })
    return success(data=serialize_policy(policy), message="Policy updated successfully")


@router.get("/{policy_id}", summary="Get a specific policy version", dependencies=[has_permission("policy:view")])
@limiter.limit(LIMIT_POLICY)
async def get_policy(
    request: Request,
    policy_id: str,
    db: DBSession,
    current_user: CurrentUser,
):
    where_clause = (Policy.org_id == current_user.org_id) if current_user.org_id else (Policy.user_id == current_user.id)
    result = await db.execute(
        select(Policy).where(Policy.id == policy_id, where_clause)
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise NotFound("Policy not found")
    return success(data=serialize_policy(policy), message="Policy fetched")


@router.delete("/{policy_id}", summary="Delete a policy version", status_code=200, dependencies=[has_permission("policy:delete")])
@limiter.limit(LIMIT_POLICY)
async def delete_policy(
    request: Request,
    policy_id: str,
    db: DBSession,
    current_user: CurrentUser,
):
    where_clause = (Policy.org_id == current_user.org_id) if current_user.org_id else (Policy.user_id == current_user.id)
    result = await db.execute(
        select(Policy).where(Policy.id == policy_id, where_clause)
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise NotFound("Policy not found")

    await log_admin_action(
        db,
        request=request,
        user=current_user,
        action="policy:delete",
        module=PermissionModule.POLICY,
        description=f"Deleted DLP policy version {policy.version}",
        entity_id=policy.id,
        entity_type="Policy",
        entity_name=f"v{policy.version}",
        before_state={"config": policy.config},
        risk_level=RiskLevel.CRITICAL
    )

    await db.delete(policy)
    await db.commit()
    return success(message="Policy deleted successfully")