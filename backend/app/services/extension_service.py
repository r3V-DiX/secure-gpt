# backend/app/services/extension_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Extension service — handles log batch ingest and policy sync.
# ─────────────────────────────────────────────────────────────────────────────

import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.audit_log import AuditLog, ActionType
from app.models.policy import Policy

logger = logging.getLogger(__name__)

# Default policy config served when user has no policy set up yet.
# updatedAt is intentionally omitted here — callers inject it at request time.
DEFAULT_POLICY_CONFIG = {
    "version": 1,
    "categories": {
        "FINANCIAL": {"enabled": True, "action": "BLOCK", "customKeywords": [], "allowlist": [], "fuzzyMatch": False, "customRules": []},
        "PII": {"enabled": True, "action": "MASK", "customKeywords": [], "allowlist": [], "fuzzyMatch": False, "customRules": []},
        "CONFIDENTIAL": {"enabled": True, "action": "BLOCK", "customKeywords": [], "allowlist": [], "fuzzyMatch": False, "customRules": []},
        "IP": {"enabled": True, "action": "WARN_ALLOW", "customKeywords": [], "allowlist": [], "fuzzyMatch": False, "customRules": []},
    },
    "monitoredPlatforms": ["chatgpt", "gemini", "copilot", "claude", "perplexity", "meta-ai"],
    "customDomains": [],
    "allowPause": True,
    "logUserEmail": False,
    "sensitivityLevel": "medium",
}


async def ingest_log_batch(
    db: AsyncSession,
    user_id: str,
    events: list[dict],
) -> int:
    """
    Ingest a batch of detection events from the extension.
    Deduplicates by event_id. Returns count of new events stored.
    """
    if not events:
        return 0

    inserted = 0
    for event in events:
        event_id = event.get("eventId") or event.get("event_id")

        # Skip duplicates
        if event_id:
            existing = await db.execute(
                select(AuditLog).where(AuditLog.event_id == event_id)
            )
            if existing.scalar_one_or_none():
                continue

        # Parse timestamp
        ts = event.get("timestamp")
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except ValueError:
                ts = datetime.now(timezone.utc)
        elif not ts:
            ts = datetime.now(timezone.utc)

        log = AuditLog(
            event_id=event_id,
            user_id=user_id,
            action_taken=_parse_action(event.get("actionTaken") or event.get("action_taken", "ALLOW")),
            category_triggered=event.get("categoryTriggered") or event.get("category_triggered", "PII"),
            detection_type=event.get("detectionType") or event.get("detection_type", "unknown"),
            detection_tier=event.get("detectionTier") or event.get("detection_tier", "regex"),
            llm_platform=event.get("llmPlatform") or event.get("llm_platform", "unknown"),
            domain=event.get("domain"),
            match_count=event.get("matchCount") or event.get("match_count", 1),
            snippet_hash=event.get("snippetHash") or event.get("snippet_hash"),
            entity_types=event.get("entityTypes") or event.get("entity_types", []),
            severities=event.get("severities", []),
            extension_version=event.get("extensionVersion") or event.get("extension_version"),
            os_platform=event.get("osPlatform") or event.get("os_platform"),
            browser=event.get("browser"),
            acknowledged=event.get("acknowledged", False),
            latency_ms=event.get("latencyMs") or event.get("latency_ms"),
            pipeline_version=event.get("pipelineVersion") or event.get("pipeline_version"),
            timestamp=ts,
        )
        db.add(log)
        inserted += 1

    if inserted:
        await db.flush()
        logger.info("Ingested %d log events for user %s", inserted, user_id)

    return inserted


async def get_policy_for_extension(
    db: AsyncSession,
    user_id: str,
) -> dict:
    """
    Return the active policy config for extension polling.
    Falls back to default config if user has no policy.
    """
    result = await db.execute(
        select(Policy)
        .where(Policy.user_id == user_id, Policy.is_active == True)  # noqa: E712
        .order_by(Policy.version.desc())
        .limit(1)  # FIX: prevent MultipleResultsFound on race condition
    )
    policy = result.scalar_one_or_none()

    if not policy:
        import copy
        default = copy.deepcopy(DEFAULT_POLICY_CONFIG)
        default["updatedAt"] = datetime.now(timezone.utc).isoformat()
        return {
            "version": 1,
            "config": default,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }

    return {
        "version": policy.version,
        "config": policy.config,
        "updatedAt": policy.updated_at.isoformat(),
    }


def _parse_action(value: str) -> ActionType:
    try:
        return ActionType(value.upper())
    except ValueError:
        return ActionType.ALLOW