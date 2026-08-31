# backend/app/services/policy_service.py

from app.models.policy import PolicyAction

ACTION_SEVERITY_ORDER = {
    PolicyAction.BLOCK: 4,
    PolicyAction.MASK: 3,
    PolicyAction.WARN: 2,
    PolicyAction.LOG_ONLY: 1,
}


def resolve_strictest_action(actions: list[PolicyAction]) -> PolicyAction | None:
    """
    Given a list of triggered policy actions, returns the strictest action.
    Hierarchy: BLOCK > MASK > WARN > LOG_ONLY
    """
    if not actions:
        return None
    return max(actions, key=lambda a: ACTION_SEVERITY_ORDER.get(a, 0))
