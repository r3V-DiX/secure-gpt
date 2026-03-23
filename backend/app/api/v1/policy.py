# backend/app/api/v1/policy.py

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime

from app.core.dependencies import DBSession, CurrentUser, RequireSecurityAdmin
from app.models.policy import Policy

router = APIRouter(prefix="/policy", tags=["policy"])


class PolicyCreateRequest(BaseModel):
    name: str
    description: str | None = None
    rules: dict = {}
    org_id: str | None = None


class PolicyUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    rules: dict | None = None
    is_active: bool | None = None


class PolicyResponse(BaseModel):
    id: str
    name: str
    description: str | None
    rules: dict
    is_active: bool
    org_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PolicyListResponse(BaseModel):
    total: int
    items: list[PolicyResponse]


@router.get("", response_model=PolicyListResponse)
async def list_policies(
    db: DBSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = select(Policy)
    # Users only see policies for their org
    if current_user.org_id:
        query = query.where(Policy.org_id == current_user.org_id)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(Policy.created_at.desc())
    result = await db.execute(query)
    policies = result.scalars().all()

    return PolicyListResponse(total=total, items=[PolicyResponse.model_validate(p) for p in policies])


@router.post("", response_model=PolicyResponse, status_code=201, dependencies=[RequireSecurityAdmin])
async def create_policy(body: PolicyCreateRequest, db: DBSession, current_user: CurrentUser):
    policy = Policy(
        name=body.name,
        description=body.description,
        rules=body.rules,
        org_id=body.org_id or current_user.org_id,
    )
    db.add(policy)
    await db.flush()
    await db.refresh(policy)
    return PolicyResponse.model_validate(policy)


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: str, db: DBSession):
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return PolicyResponse.model_validate(policy)


@router.patch("/{policy_id}", response_model=PolicyResponse, dependencies=[RequireSecurityAdmin])
async def update_policy(policy_id: str, body: PolicyUpdateRequest, db: DBSession):
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(policy, field, value)

    await db.flush()
    await db.refresh(policy)
    return PolicyResponse.model_validate(policy)


@router.delete("/{policy_id}", status_code=204, dependencies=[RequireSecurityAdmin])
async def delete_policy(policy_id: str, db: DBSession):
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    await db.delete(policy)