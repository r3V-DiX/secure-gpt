# backend/app/api/v1/devices.py

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime

from app.core.dependencies import DBSession, CurrentUser, RequireSecurityAdmin
from app.models.device import Device

router = APIRouter(prefix="/devices", tags=["devices"])


class DeviceResponse(BaseModel):
    id: str
    name: str
    hostname: str | None
    os: str | None
    browser: str | None
    extension_version: str | None
    is_active: bool
    user_id: str | None
    org_id: str | None
    created_at: datetime
    last_seen_at: datetime | None

    model_config = {"from_attributes": True}


class DeviceCreateRequest(BaseModel):
    name: str
    hostname: str | None = None
    os: str | None = None
    browser: str | None = None
    extension_version: str | None = None


class DevicesListResponse(BaseModel):
    total: int
    items: list[DeviceResponse]


@router.get("", response_model=DevicesListResponse, dependencies=[RequireSecurityAdmin])
async def list_devices(
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    org_id: str | None = None,
    user_id: str | None = None,
):
    query = select(Device)
    if org_id:
        query = query.where(Device.org_id == org_id)
    if user_id:
        query = query.where(Device.user_id == user_id)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(Device.created_at.desc())
    result = await db.execute(query)
    devices = result.scalars().all()

    return DevicesListResponse(total=total, items=[DeviceResponse.model_validate(d) for d in devices])


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(body: DeviceCreateRequest, db: DBSession, current_user: CurrentUser):
    device = Device(
        **body.model_dump(),
        user_id=current_user.id,
        org_id=current_user.org_id,
    )
    db.add(device)
    await db.flush()
    await db.refresh(device)
    return DeviceResponse.model_validate(device)


@router.get("/{device_id}", response_model=DeviceResponse, dependencies=[RequireSecurityAdmin])
async def get_device(device_id: str, db: DBSession):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceResponse.model_validate(device)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[RequireSecurityAdmin])
async def delete_device(device_id: str, db: DBSession):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.delete(device)