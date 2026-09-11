# backend/app/schemas/policy_schema.py
# Aligned with actual Policy model and camelCase API

from pydantic import BaseModel, field_validator
from datetime import datetime
import re


class CustomRule(BaseModel):
    id: str                # e.g., "custom.rule_123"
    type: str = "custom"
    label: str             # e.g., "Project X Internal Code"
    pattern: str           # Regex string
    caseSensitive: bool = False
    severity: str          # "low" | "medium" | "high" | "critical"
    description: str | None = None
    requireContext: bool = False
    triggers: list[str] = []
    maskingLabel: str | None = None  # e.g., "INTERNAL_ID" -> [INTERNAL_ID-REDACTED]
    enabled: bool = True

    @field_validator('pattern')
    @classmethod
    def validate_pattern(cls, v: str) -> str:
        try:
            re.compile(v)
        except re.error as e:
            raise ValueError(f"Invalid regex pattern: {e}")
        
        # Basic catch-all prevention
        dangerous = [".*", ".+", ".{1,}", "^.*$", "^.+$"]
        if v.strip() in dangerous:
            raise ValueError("Dangerous catch-all regex patterns are not allowed")
        return v


class RuleOverride(BaseModel):
    enabled: bool | None = True
    action: str | None = None  # BLOCK | MASK | WARN_ALLOW | ALLOW


class CategoryConfig(BaseModel):
    enabled: bool
    action: str  # BLOCK | MASK | WARN_ALLOW | ALLOW
    customKeywords: list[str] = []
    allowlist: list[str] = []
    fuzzyMatch: bool = False
    customRules: list[CustomRule] = []
    ruleOverrides: dict[str, RuleOverride] = {}


class PIIConfig(BaseModel):
    version: int = 1
    categories: dict[str, CategoryConfig]
    monitoredPlatforms: list[str]
    customDomains: list[str] = []
    allowPause: bool = True
    logUserEmail: bool = False
    sensitivityLevel: str = "medium"
    enableDocumentScanning: bool = True
    updatedAt: str | None = None


class PolicyCreateRequest(BaseModel):
    config: PIIConfig
    department_id: str | None = None
    publishImmediately: bool = True


class PolicyUpdateRequest(BaseModel):
    config: PIIConfig
    department_id: str | None = None
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