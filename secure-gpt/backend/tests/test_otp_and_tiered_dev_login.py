# backend/tests/test_otp_and_tiered_dev_login.py

import unittest
from app.models.user import UserRole


class TestAuthAndRoles(unittest.TestCase):
    def test_tiered_roles_enum(self):
        self.assertEqual(UserRole.ORG_ADMIN.value, "org_admin")
        self.assertEqual(UserRole.DEPARTMENT_ADMIN.value, "department_admin")
        self.assertEqual(UserRole.EMPLOYEE.value, "employee")
        self.assertEqual(UserRole.USER.value, "user")


if __name__ == "__main__":
    unittest.main()
