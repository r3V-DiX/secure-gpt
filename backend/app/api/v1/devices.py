# ─────────────────────────────────────────────
# Devices Routes
# Extension device enrollment + management
# ─────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_security_admin
from app.services.device.service import (
    enroll_device,
    get_devices_by_org,
    update_device_heartbeat,
    revoke_device,
)
from app.models.user import User
import math

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.post("/enroll")
def enroll(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Enroll a new device (extension installation).
    Returns device_token ONCE — store securely in extension."""
    device, raw_token = enroll_device(
        db,
        user_id=current_user.id,
        org_id=current_user.org_id,
        os_platform=payload["os_platform"],
        browser=payload["browser"],
        extension_version=payload["extension_version"],
    )

    return {
        "success": True,
        "data": {
            "device_id": device.id,
            "device_token": raw_token,   # Raw token — only time it's returned
        },
        "message": "Device enrolled. Store the device_token securely — it will not be shown again.",
    }


@router.post("/heartbeat")
def heartbeat(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Extension pings this to update last_seen and version info."""
    try:
        device = update_device_heartbeat(
            db,
            device_id=payload["device_id"],
            extension_version=payload["extension_version"],
            os_platform=payload["os_platform"],
            browser=payload["browser"],
        )
        return {"success": True, "data": {"device_id": device.id, "last_seen_at": device.last_seen_at.isoformat()}}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/")
def list_devices(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """List all enrolled devices for the org. Security admin only."""
    devices, total = get_devices_by_org(db, current_user.org_id, page, limit)

    return {
        "success": True,
        "data": [
            {
                "id": d.id,
                "user_id": d.user_id,
                "os_platform": d.os_platform,
                "browser": d.browser,
                "extension_version": d.extension_version,
                "is_active": d.is_active,
                "last_seen_at": d.last_seen_at.isoformat() if d.last_seen_at else None,
                "enrolled_at": d.enrolled_at.isoformat(),
            }
            for d in devices
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": math.ceil(total / limit),
        },
    }


@router.delete("/{device_id}")
def revoke(
    device_id: str,
    current_user: User = Depends(require_security_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Revoke a device token. Security admin only."""
    try:
        revoke_device(db, device_id)
        return {"success": True, "message": "Device revoked"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
