# backend/app/schemas/policy.schema.py
# Aligned with actual Policy model and camelCase API

from pydantic import BaseModel
from datetime import datetime


class CategoryConfig(BaseModel):
    enabled: bool
    action: str  # BLOCK | MASK | WARN_ALLOW | ALLOW
    customKeywords: list[str] = []
    allowlist: list[str] = []
    fuzzyMatch: bool = False


class PIIConfig(BaseModel):
    version: int = 1
    categories: dict[str, CategoryConfig]
    monitoredPlatforms: list[str]
    customDomains: list[str] = []
    allowPause: bool = True
    logUserEmail: bool = False
    sensitivityLevel: str = "medium"
    updatedAt: str | None = None


class PolicyCreateRequest(BaseModel):
    config: dict  # Full PIIConfig as dict
    publishImmediately: bool = True


class PolicyUpdateRequest(BaseModel):
    config: dict
    publishImmediately: bool = True


class PolicyResponse(BaseModel):
    id: str
    userId: str | None
    config: dict
    version: int
    isActive: bool
    publishedAt: str | None
    createdAt: str
    updatedAt: str