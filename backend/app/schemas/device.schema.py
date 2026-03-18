# ─────────────────────────────────────────────
# Device Schemas
# ─────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional


class DeviceEnrollRequest(BaseModel):
    org_id: str
    os_platform: str
    browser: str
    extension_version: str


class DeviceEnrollResponse(BaseModel):
    device_id: str
    device_token: str           # raw token — sent once, never stored raw


class DeviceResponse(BaseModel):
    id: str
    user_id: str
    org_id: str
    os_platform: str
    browser: str
    extension_version: str
    is_active: bool
    last_seen_at: Optional[str]
    enrolled_at: str

    class Config:
        from_attributes = True


class DeviceHeartbeatRequest(BaseModel):
    extension_version: str
    os_platform: str
    browser: str
