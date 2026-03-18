# ─────────────────────────────────────────────
# Policy Service
# Org policy management + device sync
# ─────────────────────────────────────────────

from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.policy import Policy
from app.models.org import Org
import uuid
import json


DEFAULT_CONFIG = {
    "version": 1,
    "categories": {
        "FINANCIAL": {
            "enabled": True,
            "action": "BLOCK",
            "custom_keywords": [],
            "allowlist": [],
            "fuzzy_match": False,
        },
        "PII": {
            "enabled": True,
            "action": "MASK",
            "custom_keywords": [],
            "allowlist": [],
            "fuzzy_match": False,
        },
        "CONFIDENTIAL": {
            "enabled": True,
            "action": "BLOCK",
            "custom_keywords": [],
            "allowlist": [],
            "fuzzy_match": False,
        },
        "IP": {
            "enabled": True,
            "action": "WARN_ALLOW",
            "custom_keywords": [],
            "allowlist": [],
            "fuzzy_match": False,
        },
    },
    "monitored_platforms": [
        "chatgpt", "gemini", "copilot", "claude", "perplexity", "meta-ai"
    ],
    "custom_domains": [],
    "allow_pause": True,
    "log_user_email": False,
    "sensitivity_level": "medium",
    "updated_at": datetime.now(timezone.utc).isoformat(),
}


def get_active_policy(db: Session, org_id: str) -> Policy | None:
    """Get the currently active policy for an org."""
    return (
        db.query(Policy)
        .filter(Policy.org_id == org_id, Policy.is_active == True)
        .order_by(Policy.version.desc())
        .first()
    )


def get_policy_for_device(db: Session, org_id: str) -> dict:
    """Return policy config for extension polling.
    Falls back to default config if no policy exists."""
    policy = get_active_policy(db, org_id)

    if not policy:
        return {
            "version": 1,
            "config": DEFAULT_CONFIG,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    return {
        "version": policy.version,
        "config": policy.config,
        "updated_at": policy.updated_at.isoformat(),
    }


def create_policy(
    db: Session,
    org_id: str,
    created_by: str,
    config: dict,
    publish_immediately: bool = True,
) -> Policy:
    """Create a new policy version for an org."""
    # Deactivate previous active policy
    db.query(Policy).filter(
        Policy.org_id == org_id,
        Policy.is_active == True,
    ).update({"is_active": False})

    # Get next version number
    latest = (
        db.query(Policy)
        .filter(Policy.org_id == org_id)
        .order_by(Policy.version.desc())
        .first()
    )
    next_version = (latest.version + 1) if latest else 1

    now = datetime.now(timezone.utc)
    config["version"] = next_version
    config["updated_at"] = now.isoformat()

    policy = Policy(
        id=str(uuid.uuid4()),
        org_id=org_id,
        created_by=created_by,
        config=config,
        version=next_version,
        is_active=True,
        published_at=now if publish_immediately else None,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def update_policy(
    db: Session,
    org_id: str,
    updated_by: str,
    config: dict,
    publish_immediately: bool = True,
) -> Policy:
    """Update org policy — creates a new version."""
    return create_policy(db, org_id, updated_by, config, publish_immediately)


def get_policy_history(db: Session, org_id: str, limit: int = 10) -> list[Policy]:
    """Get policy version history for an org."""
    return (
        db.query(Policy)
        .filter(Policy.org_id == org_id)
        .order_by(Policy.version.desc())
        .limit(limit)
        .all()
    )
