# backend/app/api/v1/policy.py
# FIX: deepcopy config before mutating to avoid caller side-effects.

import copy
from datetime import datetime, timezone

from app.core.dependencies import CurrentUser, DBSession, has_permission
from app.core.exceptions import NotFound
from app.core.pagination import Pagination
from app.core.ratelimit import LIMIT_POLICY, limiter
from app.core.response import paginated, success
from app.models.policy import Policy
from app.schemas.policy_schema import PolicyCreateRequest, PolicyUpdateRequest
from app.services.extension_service import push_policy_update
from fastapi import APIRouter, Request
from sqlalchemy import func, select, update

router = APIRouter(prefix="/policy", tags=["policy"])


def _serialize_policy(policy: Policy) -> dict:
    return {
        "id": policy.id,
        "userId": policy.user_id,
        "config": policy.config,
        "version": policy.version,
        "isActive": policy.is_active,
        "publishedAt": policy.published_at.isoformat() if policy.published_at else None,
        "createdAt": policy.created_at.isoformat(),
        "updatedAt": policy.updated_at.isoformat(),
    }


@router.get("/current", summary="Get current active policy")
@limiter.limit(LIMIT_POLICY)
async def get_current_policy(request: Request, db: DBSession, current_user: CurrentUser):
    where_clause = (Policy.org_id == current_user.org_id) if current_user.org_id else (Policy.user_id == current_user.id)
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
        # FIX: return a consistent shape with top-level updatedAt so the
        # frontend Policy type doesn't get null where it expects a string.
        return success(
            data={
                "id": None,
                "userId": current_user.id,
                "config": default,
                "version": 1,
                "isActive": True,
                "publishedAt": None,
                "createdAt": None,
                "updatedAt": now,          # ← top-level field now populated
            },
            message="Default policy returned (no custom policy set)",
        )

    return success(data=_serialize_policy(policy), message="Policy fetched")


@router.get("", summary="List all policy versions", dependencies=[has_permission("policy:view")])
@limiter.limit(LIMIT_POLICY)
async def list_policies(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
):
    where_clause = (Policy.org_id == current_user.org_id) if current_user.org_id else (Policy.user_id == current_user.id)

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
        data=[_serialize_policy(p) for p in policies],
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


async def _create_policy_version(db, user_id: str, org_id: str | None, config: dict, publish: bool) -> Policy:
    """Deactivate old active policy, then create a new versioned policy."""
    # FIX: deepcopy so we don't mutate the caller's dict object.
    config = copy.deepcopy(config)

    where_clause = (Policy.org_id == org_id) if org_id else (Policy.user_id == user_id)

    await db.execute(
        update(Policy)
        .where(where_clause, Policy.is_active == True)
        .values(is_active=False)
    )
    await db.flush()

    result = await db.execute(
        select(Policy)
        .where(where_clause)
        .order_by(Policy.version.desc())
        .limit(1)
    )
    latest = result.scalars().first()
    next_version = (latest.version + 1) if latest else 1

    now = datetime.now(timezone.utc)
    config["version"] = next_version
    config["updatedAt"] = now.isoformat()

    policy = Policy(
        user_id=user_id,
        org_id=org_id,
        config=config,
        version=next_version,
        is_active=True,
        published_at=now if publish else None,
    )
    db.add(policy)
    await db.flush()
    await db.refresh(policy)
    return policy


@router.post("", summary="Create a new policy version", status_code=201, dependencies=[has_permission("policy:create")])
@limiter.limit(LIMIT_POLICY)
async def create_policy(
    request: Request,
    body: PolicyCreateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    # Fetch old active policy for diff logging
    where_clause = (Policy.org_id == current_user.org_id) if current_user.org_id else (Policy.user_id == current_user.id)
    old_res = await db.execute(
        select(Policy)
        .where(where_clause, Policy.is_active == True)
        .order_by(Policy.version.desc())
        .limit(1)
    )
    old_policy = old_res.scalar_one_or_none()
    old_config = old_policy.config if old_policy else None

    policy = await _create_policy_version(db, current_user.id, current_user.org_id, body.config.model_dump(), body.publishImmediately)

    # Log admin action
    from app.models.rbac import PermissionModule, RiskLevel
    from app.services.rbac_service import log_admin_action
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
    # Push to any connected extension SSE streams for this user/org
    await push_policy_update(current_user.id, current_user.org_id, {
        "version": policy.version,
        "config": policy.config,
        "updatedAt": policy.updated_at.isoformat(),
    })
    return success(data=_serialize_policy(policy), message="Policy created successfully")


@router.put("/current", summary="Update the active policy (creates new version)", dependencies=[has_permission("policy:update")])
@limiter.limit(LIMIT_POLICY)
async def update_policy(
    request: Request,
    body: PolicyUpdateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    # Fetch old active policy for diff logging
    where_clause = (Policy.org_id == current_user.org_id) if current_user.org_id else (Policy.user_id == current_user.id)
    old_res = await db.execute(
        select(Policy)
        .where(where_clause, Policy.is_active == True)
        .order_by(Policy.version.desc())
        .limit(1)
    )
    old_policy = old_res.scalar_one_or_none()
    old_config = old_policy.config if old_policy else None

    policy = await _create_policy_version(db, current_user.id, current_user.org_id, body.config.model_dump(), body.publishImmediately)

    # Log admin action
    from app.models.rbac import PermissionModule, RiskLevel
    from app.services.rbac_service import log_admin_action
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
    # Push to any connected extension SSE streams for this user/org
    await push_policy_update(current_user.id, current_user.org_id, {
        "version": policy.version,
        "config": policy.config,
        "updatedAt": policy.updated_at.isoformat(),
    })
    return success(data=_serialize_policy(policy), message="Policy updated successfully")


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
    return success(data=_serialize_policy(policy), message="Policy fetched")


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

    # Log admin action
    from app.models.rbac import PermissionModule, RiskLevel
    from app.services.rbac_service import log_admin_action
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