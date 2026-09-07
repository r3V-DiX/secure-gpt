# backend/tests/test_policy_inheritance.py
import unittest
from app.models.policy import PolicyAction
from app.services.policy_service import resolve_strictest_action


class TestPolicyInheritanceAndConflictResolution(unittest.TestCase):
    def test_strictest_action_resolution(self):
        # BLOCK > MASK > WARN_ALLOW > ALLOW
        self.assertEqual(
            resolve_strictest_action([PolicyAction.ALLOW, PolicyAction.WARN_ALLOW, PolicyAction.BLOCK]),
            PolicyAction.BLOCK
        )
        self.assertEqual(
            resolve_strictest_action([PolicyAction.ALLOW, PolicyAction.MASK, PolicyAction.WARN_ALLOW]),
            PolicyAction.MASK
        )
        self.assertEqual(
            resolve_strictest_action([PolicyAction.ALLOW, PolicyAction.WARN_ALLOW]),
            PolicyAction.WARN_ALLOW
        )
        self.assertEqual(
            resolve_strictest_action([PolicyAction.ALLOW]),
            PolicyAction.ALLOW
        )
        self.assertIsNone(resolve_strictest_action([]))


if __name__ == "__main__":
    unittest.main()
