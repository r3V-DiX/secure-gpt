# ─────────────────────────────────────────────
# Policy Schemas
# ─────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryConfigSchema(BaseModel):
    enabled: bool
    action: str
    custom_keywords: list[str] = []
    allowlist: list[str] = []
    fuzzy_match: bool = False


class PIIConfigSchema(BaseModel):
    version: int
    categories: dict[str, CategoryConfigSchema]
    monitored_platforms: list[str]
    custom_domains: list[str] = []
    allow_pause: bool = True
    log_user_email: bool = False
    sensitivity_level: str = "medium"
    updated_at: str


class PolicyCreateRequest(BaseModel):
    config: PIIConfigSchema
    publish_immediately: bool = True


class PolicyUpdateRequest(BaseModel):
    config: PIIConfigSchema
    publish_immediately: bool = True


class PolicyResponse(BaseModel):
    id: str
    org_id: str
    config: dict
    version: int
    is_active: bool
    published_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class DevicePolicyResponse(BaseModel):
    version: int
    config: dict
    updated_at: str
