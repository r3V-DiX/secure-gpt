# backend/app/api/v1/devices.py

from datetime import datetime, timezone
from fastapi import APIRouter, Request
from sqlalchemy import select, func, desc
from pydantic import BaseModel

from app.core.dependencies import DBSession, CurrentUser
from app.core.exceptions import NotFound
from app.core.pagination import Pagination
from app.core.response import success, paginated
from app.core.ratelimit import limiter, LIMIT_DEVICES
from app.models.device import Device

router = APIRouter(prefix="/devices", tags=["devices"])


class DeviceRegisterRequest(BaseModel):
    name: str
    hostname: str | None = None
    osPlatform: str | None = None
    browser: str | None = None
    extensionVersion: str | None = None


def _serialize_device(device: Device) -> dict:
    return {
        "id": device.id,
        "userId": device.user_id,
        "name": device.name,
        "hostname": device.hostname,
        "osPlatform": device.os_platform,
        "browser": device.browser,
        "extensionVersion": device.extension_version,
        "isActive": device.is_active,
        "createdAt": device.created_at.isoformat(),
        "lastSeenAt": device.last_seen_at.isoformat() if device.last_seen_at else None,
    }


@router.get("", summary="List own devices")
@limiter.limit(LIMIT_DEVICES)
async def list_devices(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
):
    count_result = await db.execute(
        select(func.count()).select_from(
            select(Device).where(Device.user_id == current_user.id).subquery()
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Device)
        .where(Device.user_id == current_user.id)
        .order_by(desc(Device.created_at))
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    devices = result.scalars().all()

    return paginated(
        data=[_serialize_device(d) for d in devices],
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.post("", summary="Register a new device", status_code=201)
@limiter.limit(LIMIT_DEVICES)
async def register_device(
    request: Request,
    body: DeviceRegisterRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    device = Device(
        user_id=current_user.id,
        name=body.name,
        hostname=body.hostname,
        os_platform=body.osPlatform,
        browser=body.browser,
        extension_version=body.extensionVersion,
        last_seen_at=datetime.now(timezone.utc),
    )
    db.add(device)
    await db.flush()
    await db.refresh(device)
    await db.commit()  # explicit commit — get_db no longer auto-commits

    return success(data=_serialize_device(device), message="Device registered successfully")


@router.get("/{device_id}", summary="Get a specific device")
@limiter.limit(LIMIT_DEVICES)
async def get_device(
    request: Request,
    device_id: str,
    db: DBSession,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == current_user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise NotFound("Device not found")
    return success(data=_serialize_device(device), message="Device fetched")


@router.patch("/{device_id}/heartbeat", summary="Update device last seen")
@limiter.limit(LIMIT_DEVICES)
async def device_heartbeat(
    request: Request,
    device_id: str,
    db: DBSession,
    current_user: CurrentUser,
    body: DeviceRegisterRequest | None = None,
):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == current_user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise NotFound("Device not found")

    device.last_seen_at = datetime.now(timezone.utc)
    if body:
        if body.extensionVersion:
            device.extension_version = body.extensionVersion
        if body.osPlatform:
            device.os_platform = body.osPlatform
        if body.browser:
            device.browser = body.browser

    await db.flush()
    await db.commit()

    return success(data=_serialize_device(device), message="Heartbeat updated")


@router.delete("/{device_id}", summary="Remove a device", status_code=200)
@limiter.limit(LIMIT_DEVICES)
async def delete_device(
    request: Request,
    device_id: str,
    db: DBSession,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == current_user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise NotFound("Device not found")

    await db.delete(device)
    await db.commit()

    return success(message="Device removed successfully")