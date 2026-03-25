# backend/app/api/v1/policy.py
# FIX: deepcopy config before mutating to avoid caller side-effects.

import copy
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from sqlalchemy import select, update, func, desc
from pydantic import BaseModel

from app.core.dependencies import DBSession, CurrentUser
from app.core.exceptions import NotFound
from app.core.response import success, paginated
from app.core.pagination import Pagination
from app.core.ratelimit import limiter, LIMIT_POLICY
from app.models.policy import Policy

router = APIRouter(prefix="/policy", tags=["policy"])


class PolicyCreateRequest(BaseModel):
    config: dict
    publishImmediately: bool = True


class PolicyUpdateRequest(BaseModel):
    config: dict
    publishImmediately: bool = True


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
    result = await db.execute(
        select(Policy)
        .where(Policy.user_id == current_user.id, Policy.is_active == True)  # noqa: E712
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


@router.get("", summary="List all policy versions")
@limiter.limit(LIMIT_POLICY)
async def list_policies(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
):
    count_result = await db.execute(
        select(func.count()).select_from(
            select(Policy).where(Policy.user_id == current_user.id).subquery()
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Policy)
        .where(Policy.user_id == current_user.id)
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


async def _create_policy_version(db, user_id: str, config: dict, publish: bool) -> Policy:
    """Deactivate old active policy, then create a new versioned policy."""
    # FIX: deepcopy so we don't mutate the caller's dict object.
    config = copy.deepcopy(config)

    await db.execute(
        update(Policy)
        .where(Policy.user_id == user_id, Policy.is_active == True)  # noqa: E712
        .values(is_active=False)
    )
    await db.flush()

    result = await db.execute(
        select(Policy)
        .where(Policy.user_id == user_id)
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
        config=config,
        version=next_version,
        is_active=True,
        published_at=now if publish else None,
    )
    db.add(policy)
    await db.flush()
    await db.refresh(policy)
    return policy


@router.post("", summary="Create a new policy version", status_code=201)
@limiter.limit(LIMIT_POLICY)
async def create_policy(
    request: Request,
    body: PolicyCreateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    policy = await _create_policy_version(db, current_user.id, body.config, body.publishImmediately)
    await db.commit()
    return success(data=_serialize_policy(policy), message="Policy created successfully")


@router.put("/current", summary="Update the active policy (creates new version)")
@limiter.limit(LIMIT_POLICY)
async def update_policy(
    request: Request,
    body: PolicyUpdateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    policy = await _create_policy_version(db, current_user.id, body.config, body.publishImmediately)
    await db.commit()
    return success(data=_serialize_policy(policy), message="Policy updated successfully")


@router.get("/{policy_id}", summary="Get a specific policy version")
@limiter.limit(LIMIT_POLICY)
async def get_policy(
    request: Request,
    policy_id: str,
    db: DBSession,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(Policy).where(Policy.id == policy_id, Policy.user_id == current_user.id)
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise NotFound("Policy not found")
    return success(data=_serialize_policy(policy), message="Policy fetched")


@router.delete("/{policy_id}", summary="Delete a policy version", status_code=200)
@limiter.limit(LIMIT_POLICY)
async def delete_policy(
    request: Request,
    policy_id: str,
    db: DBSession,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(Policy).where(Policy.id == policy_id, Policy.user_id == current_user.id)
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise NotFound("Policy not found")
    await db.delete(policy)
    await db.commit()
    return success(message="Policy deleted successfully")