# backend/app/services/extension_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Extension service — handles log batch ingest and policy sync.
# ─────────────────────────────────────────────────────────────────────────────

import asyncio
import logging
from datetime import datetime, timezone
from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.audit_log import AuditLog, ActionType
from app.models.policy import Policy

# ── SSE subscriber registry ───────────────────────────────────────────────────
# Maps user_id or org_id → set of asyncio.Queue instances.
_policy_subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)


def subscribe_policy(user_id: str, org_id: str | None) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    key = org_id if org_id else user_id
    _policy_subscribers[key].add(q)
    return q


def unsubscribe_policy(user_id: str, org_id: str | None, q: asyncio.Queue) -> None:
    key = org_id if org_id else user_id
    _policy_subscribers[key].discard(q)
    if not _policy_subscribers[key]:
        del _policy_subscribers[key]


async def push_policy_update(user_id: str, org_id: str | None, policy_data: dict) -> None:
    key = org_id if org_id else user_id
    for q in list(_policy_subscribers.get(key, [])):
        await q.put(policy_data)

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
    "monitoredPlatforms": ["chatgpt", "gemini", "google-ai-mode", "copilot", "claude", "perplexity", "meta-ai"],
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
    from app.models.user import User
    user_email = None
    org_id = None
    if user_id:
        user_res = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if user_res:
            user_email = user_res.email
            org_id = user_res.org_id

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
            user_email=user_email,
            org_id=org_id,
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
    from app.models.user import User
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()

    if user and user.org_id:
        where_clause = (Policy.org_id == user.org_id)
    else:
        where_clause = (Policy.user_id == user_id)

    result = await db.execute(
        select(Policy)
        .where(where_clause, Policy.is_active == True)  # noqa: E712
        .order_by(Policy.version.desc())
        .limit(1)  # FIX: prevent MultipleResultsFound on race condition
    )
    policy = result.scalar_one_or_none()

    is_org_suspended = False
    if user and user.org_id:
        from app.models.org import Organisation, OrgStatus
        org_res = await db.execute(select(Organisation).where(Organisation.id == user.org_id))
        org_obj = org_res.scalar_one_or_none()
        if org_obj and org_obj.status == OrgStatus.SUSPENDED:
            is_org_suspended = True

    if not policy:
        import copy
        default = copy.deepcopy(DEFAULT_POLICY_CONFIG)
        default["updatedAt"] = datetime.now(timezone.utc).isoformat()
        return {
            "version": 1,
            "config": default,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "org_status": "SUSPENDED" if is_org_suspended else "ACTIVE",
            "enforcement_disabled": is_org_suspended,
        }

    return {
        "version": policy.version,
        "config": policy.config,
        "updatedAt": policy.updated_at.isoformat(),
        "org_status": "SUSPENDED" if is_org_suspended else "ACTIVE",
        "enforcement_disabled": is_org_suspended,
    }


def _parse_action(value: str) -> ActionType:
    try:
        return ActionType(value.upper())
    except ValueError:
        return ActionType.ALLOW
