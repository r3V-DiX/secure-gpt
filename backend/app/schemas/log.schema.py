# backend/app/schemas/log.schema.py
# Aligned with actual AuditLog model and camelCase API responses

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re


class ExtensionLogEvent(BaseModel):
    """Single detection event sent from the browser extension."""
    eventId: str
    timestamp: str
    actionTaken: str
    categoryTriggered: str
    detectionType: str
    detectionTier: str = "regex"
    llmPlatform: str
    domain: str | None = None
    matchCount: int = 1
    snippetHash: str | None = None
    entityTypes: list[str] = []
    severities: list[str] = []
    extensionVersion: str | None = None
    osPlatform: str | None = None
    browser: str | None = None
    acknowledged: bool = False
    latencyMs: int | None = None
    pipelineVersion: str | None = None

    @field_validator("llmPlatform")
    @classmethod
    def sanitize_platform(cls, v: str) -> str:
        return v.split("/")[0].lower()

    @field_validator("detectionType")
    @classmethod
    def validate_detection_type(cls, v: str) -> str:
        """Ensure detectionType is a label, not raw PII."""
        if not re.match(r"^[a-zA-Z0-9_]{1,100}$", v):
            raise ValueError(
                f"detectionType must be an alphanumeric label, got: {v!r}"
            )
        return v


class ExtensionLogBatchRequest(BaseModel):
    events: list[ExtensionLogEvent] = Field(..., max_length=100)


class LogResponse(BaseModel):
    id: str
    eventId: str | None
    actionTaken: str
    categoryTriggered: str
    detectionType: str
    detectionTier: str
    llmPlatform: str
    domain: str | None
    matchCount: int
    entityTypes: list[str]
    severities: list[str]
    extensionVersion: str | None
    osPlatform: str | None
    browser: str | None
    acknowledged: bool
    latencyMs: int | None
    timestamp: str
    receivedAt: str


class LogStatsResponse(BaseModel):
    totalEvents: int
    blockedCount: int
    maskedCount: int
    warnedCount: int
    allowedCount: int
    topEntityTypes: list[dict]
    topPlatforms: list[dict]
    topDomains: list[dict]