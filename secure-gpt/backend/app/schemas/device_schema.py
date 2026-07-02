# backend/app/schemas/device_schema.py
# Aligned with actual Device model and devices.py API

from pydantic import BaseModel


class DeviceRegisterRequest(BaseModel):
    name: str
    hostname: str | None = None
    osPlatform: str | None = None
    browser: str | None = None
    extensionVersion: str | None = None


class DeviceHeartbeatRequest(BaseModel):
    extensionVersion: str | None = None
    osPlatform: str | None = None
    browser: str | None = None


class DeviceResponse(BaseModel):
    id: str
    userId: str | None
    name: str
    hostname: str | None
    osPlatform: str | None
    browser: str | None
    extensionVersion: str | None
    isActive: bool
    createdAt: str
    lastSeenAt: str | None

    model_config = {"from_attributes": True}