# ─────────────────────────────────────────────
# Device Service
# Extension device enrollment + management
# ─────────────────────────────────────────────

from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone
from app.models.device import Device
from app.core.security import generate_device_token, hash_device_token
import uuid


def enroll_device(
    db: Session,
    user_id: str,
    org_id: str,
    os_platform: str,
    browser: str,
    extension_version: str,
) -> tuple[Device, str]:
    """Enroll a new device. Returns (device, raw_token).
    Raw token is returned ONCE — never stored raw."""
    raw_token = generate_device_token()
    token_hash = hash_device_token(raw_token)

    device = Device(
        id=str(uuid.uuid4()),
        user_id=user_id,
        org_id=org_id,
        token_hash=token_hash,
        os_platform=os_platform,
        browser=browser,
        extension_version=extension_version,
        is_active=True,
        enrolled_at=datetime.now(timezone.utc),
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device, raw_token


def get_devices_by_org(
    db: Session,
    org_id: str,
    page: int = 1,
    limit: int = 50,
) -> tuple[list[Device], int]:
    query = db.query(Device).filter(Device.org_id == org_id)
    total = query.count()
    devices = (
        query.order_by(desc(Device.last_seen_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return devices, total


def update_device_heartbeat(
    db: Session,
    device_id: str,
    extension_version: str,
    os_platform: str,
    browser: str,
) -> Device:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise ValueError("Device not found")

    device.last_seen_at = datetime.now(timezone.utc)
    device.extension_version = extension_version
    device.os_platform = os_platform
    device.browser = browser
    db.commit()
    db.refresh(device)
    return device


def revoke_device(db: Session, device_id: str) -> Device:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise ValueError("Device not found")
    device.is_active = False
    db.commit()
    db.refresh(device)
    return device
