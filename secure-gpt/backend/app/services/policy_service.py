# backend/app/services/policy_service.py

from app.models.policy import PolicyAction

ACTION_SEVERITY_ORDER = {
    PolicyAction.BLOCK: 4,
    PolicyAction.MASK: 3,
    PolicyAction.WARN_ALLOW: 2,
    PolicyAction.ALLOW: 1,
}


def resolve_strictest_action(actions: list[PolicyAction]) -> PolicyAction | None:
    """
    Given a list of triggered policy actions, returns the strictest action.
    Hierarchy: BLOCK > MASK > WARN_ALLOW > ALLOW
    """
    if not actions:
        return None
    return max(actions, key=lambda a: ACTION_SEVERITY_ORDER.get(a, 0))
