# ─────────────────────────────────────────────
# Log Schemas
# ─────────────────────────────────────────────

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AuditLogEventSchema(BaseModel):
    event_id: str
    timestamp: datetime
    user_id: str
    user_email: Optional[str] = None
    org_id: str
    department: Optional[str] = None
    action_taken: str
    category_triggered: str
    detection_type: str
    detection_tier: str = "regex"
    llm_platform: str
    match_count: int = 1
    snippet_hash: str
    extension_version: str
    os_platform: str
    browser: str
    acknowledged: bool = False


class LogBatchRequest(BaseModel):
    device_token: str
    org_id: str
    events: list[AuditLogEventSchema] = Field(max_length=50)


class LogBatchResponse(BaseModel):
    received: int
    message: str


class AuditLogResponse(BaseModel):
    id: str
    event_id: str
    timestamp: str
    user_id: str
    user_email: Optional[str]
    org_id: str
    department: Optional[str]
    action_taken: str
    category_triggered: str
    detection_type: str
    detection_tier: str
    llm_platform: str
    match_count: int
    extension_version: str
    os_platform: str
    browser: str
    acknowledged: bool

    class Config:
        from_attributes = True


class LogStatsResponse(BaseModel):
    total_events: int
    blocked_count: int
    masked_count: int
    warned_count: int
    allowed_count: int
    top_categories: list[dict]
    top_platforms: list[dict]
    top_users: list[dict]


class LogFiltersSchema(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_id: Optional[str] = None
    action: Optional[str] = None
    category: Optional[str] = None
    platform: Optional[str] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=50, ge=1, le=200)
