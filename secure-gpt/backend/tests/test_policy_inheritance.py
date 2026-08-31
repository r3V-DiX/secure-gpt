# backend/tests/test_policy_inheritance.py
import unittest
from app.models.policy import PolicyAction
from app.services.policy_service import resolve_strictest_action


class TestPolicyInheritanceAndConflictResolution(unittest.TestCase):
    def test_strictest_action_resolution(self):
        # BLOCK > MASK > WARN > LOG_ONLY
        self.assertEqual(
            resolve_strictest_action([PolicyAction.LOG_ONLY, PolicyAction.WARN, PolicyAction.BLOCK]),
            PolicyAction.BLOCK
        )
        self.assertEqual(
            resolve_strictest_action([PolicyAction.LOG_ONLY, PolicyAction.MASK, PolicyAction.WARN]),
            PolicyAction.MASK
        )
        self.assertEqual(
            resolve_strictest_action([PolicyAction.LOG_ONLY, PolicyAction.WARN]),
            PolicyAction.WARN
        )
        self.assertEqual(
            resolve_strictest_action([PolicyAction.LOG_ONLY]),
            PolicyAction.LOG_ONLY
        )
        self.assertIsNone(resolve_strictest_action([]))


if __name__ == "__main__":
    unittest.main()
