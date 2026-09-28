"""
Helper functions for DLP policy serialization and version lifecycle.
"""
import copy
from datetime import datetime, timezone
from sqlalchemy import select, update
from app.models.policy import Policy


def serialize_policy(policy: Policy) -> dict:
    """Serialize Policy model instance to dictionary."""
    return {
        "id": policy.id,
        "userId": policy.user_id,
        "orgId": policy.org_id,
        "departmentId": policy.department_id,
        "config": policy.config,
        "version": policy.version,
        "isActive": policy.is_active,
        "publishedAt": policy.published_at.isoformat() if policy.published_at else None,
        "createdAt": policy.created_at.isoformat(),
        "updatedAt": policy.updated_at.isoformat(),
    }


def get_policy_where_clause(user_id: str, org_id: str | None, department_id: str | None = None):
    """Generate SQLAlchemy where filter condition for policy scoping."""
    if department_id and org_id:
        return (Policy.org_id == org_id) & (Policy.department_id == department_id)
    elif org_id:
        return (Policy.org_id == org_id) & (Policy.department_id == None)
    else:
        return (Policy.user_id == user_id)


async def create_policy_version(
    db, user_id: str, org_id: str | None, department_id: str | None, config: dict, publish: bool
) -> Policy:
    """Deactivate old active policy, then create a new versioned policy."""
    config = copy.deepcopy(config)
    where_clause = get_policy_where_clause(user_id, org_id, department_id)

    await db.execute(
        update(Policy)
        .where(where_clause, Policy.is_active == True)
        .values(is_active=False)
    )
    await db.flush()

    result = await db.execute(
        select(Policy)
        .where(where_clause)
        .order_by(Policy.version.desc())
        .limit(1)
    )
    latest = result.scalars().first()
    next_version = (latest.version + 1) if latest else 1

    now = datetime.now(timezone.utc)
    config["version"] = next_version
    config["updatedAt"] = now.isoformat()

    policy = Policy(
        user_id=user_id,
        org_id=org_id,
        department_id=department_id,
        config=config,
        version=next_version,
        is_active=True,
        published_at=now if publish else None,
    )
    db.add(policy)
    await db.flush()
    await db.refresh(policy)
    return policy
