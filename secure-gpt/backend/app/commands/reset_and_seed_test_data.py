"""
Fixture datasets and scenarios for test environment seeding.
"""
from app.models.user import UserRole
from app.models.audit_log import ActionType

DEPARTMENTS_DATA = [
    {
        "name": "Security & SecOps",
        "description": "Threat hunters, SOC analysts, and security engineers requiring strict zero-leakage DLP.",
    },
    {
        "name": "Engineering & AI Lab",
        "description": "Core software engineers and ML researchers working with proprietary models and codebases.",
    },
    {
        "name": "Finance & Operations",
        "description": "Accounting and treasury personnel handling payment cards, IBANs, and revenue metrics.",
    },
    {
        "name": "Product & Growth",
        "description": "Product management, design, and growth teams interacting with AI daily.",
    },
]

ADDITIONAL_TEAM = [
    {"prefix": "sarah.connor", "name": "Sarah Connor", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
    {"prefix": "marcus.vance", "name": "Marcus Vance", "role": UserRole.EMPLOYEE, "dept": "Security & SecOps"},
    {"prefix": "elena.rostova", "name": "Elena Rostova", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
    {"prefix": "david.ops", "name": "David Miller", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
    {"prefix": "sophia.pm", "name": "Sophia Torres", "role": UserRole.EMPLOYEE, "dept": "Product & Growth"},
]

PLATFORMS = [
    {"name": "ChatGPT", "domain": "chatgpt.com"},
    {"name": "Claude", "domain": "claude.ai"},
    {"name": "Perplexity", "domain": "perplexity.ai"},
    {"name": "DeepSeek", "domain": "deepseek.com"},
]

DETECTION_SCENARIOS = [
    {
        "cat": "IP",
        "det_type": "api_key",
        "tier": "regex",
        "entities": ["openai_api_key", "aws_secret_key"],
        "severities": ["CRITICAL"],
        "actions": [ActionType.BLOCK, ActionType.BLOCK, ActionType.MASK],
    },
    {
        "cat": "IP",
        "det_type": "github_token",
        "tier": "regex",
        "entities": ["github_pat"],
        "severities": ["HIGH"],
        "actions": [ActionType.BLOCK, ActionType.MASK],
    },
    {
        "cat": "IP",
        "det_type": "private_key",
        "tier": "regex",
        "entities": ["rsa_private_key"],
        "severities": ["CRITICAL"],
        "actions": [ActionType.BLOCK],
    },
    {
        "cat": "FINANCIAL",
        "det_type": "credit_card",
        "tier": "regex",
        "entities": ["visa_credit_card", "mastercard_credit_card"],
        "severities": ["HIGH"],
        "actions": [ActionType.BLOCK, ActionType.MASK, ActionType.WARN_ALLOW],
    },
    {
        "cat": "FINANCIAL",
        "det_type": "iban",
        "tier": "regex",
        "entities": ["iban_code"],
        "severities": ["HIGH"],
        "actions": [ActionType.BLOCK, ActionType.MASK],
    },
    {
        "cat": "FINANCIAL",
        "det_type": "pan_card",
        "tier": "ocr",
        "entities": ["indian_pan_card"],
        "severities": ["HIGH"],
        "actions": [ActionType.BLOCK, ActionType.MASK],
    },
    {
        "cat": "PII",
        "det_type": "aadhaar",
        "tier": "regex",
        "entities": ["aadhaar_number"],
        "severities": ["HIGH"],
        "actions": [ActionType.BLOCK, ActionType.MASK],
    },
    {
        "cat": "PII",
        "det_type": "ssn",
        "tier": "regex",
        "entities": ["us_ssn"],
        "severities": ["CRITICAL"],
        "actions": [ActionType.BLOCK, ActionType.MASK],
    },
    {
        "cat": "PII",
        "det_type": "person_name",
        "tier": "ner",
        "entities": ["person_name", "job_title"],
        "severities": ["MEDIUM"],
        "actions": [ActionType.MASK, ActionType.WARN_ALLOW, ActionType.ALLOW],
    },
    {
        "cat": "PII",
        "det_type": "email",
        "tier": "regex",
        "entities": ["email_address", "phone_number"],
        "severities": ["LOW", "MEDIUM"],
        "actions": [ActionType.MASK, ActionType.WARN_ALLOW],
    },
    {
        "cat": "CONFIDENTIAL",
        "det_type": "jwt_token",
        "tier": "regex",
        "entities": ["jwt_session_token"],
        "severities": ["HIGH"],
        "actions": [ActionType.BLOCK, ActionType.MASK],
    },
    {
        "cat": "CONFIDENTIAL",
        "det_type": "internal_ip",
        "tier": "regex",
        "entities": ["internal_ipv4", "internal_hostname"],
        "severities": ["MEDIUM"],
        "actions": [ActionType.MASK, ActionType.WARN_ALLOW],
    },
]
