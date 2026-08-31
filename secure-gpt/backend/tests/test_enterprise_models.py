# backend/tests/test_enterprise_models.py
import unittest
import uuid
from app.models.org import Organisation, OrgStatus
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.policy import Policy, PolicyAction, PolicyCategory
from app.models.dlp_incident import DLPIncident


class TestEnterpriseHierarchyModels(unittest.TestCase):
    def test_create_organisation_model(self):
        org = Organisation(
            id=str(uuid.uuid4()),
            name="Acme Security",
            domain="acme.com",
            admin_email="admin@acme.com",
            status=OrgStatus.PENDING_VERIFICATION,
            dns_txt_token="securegpt-verification=test-token-12345",
        )
        self.assertEqual(org.name, "Acme Security")
        self.assertEqual(org.domain, "acme.com")
        self.assertEqual(org.status, OrgStatus.PENDING_VERIFICATION)
        self.assertTrue(org.dns_txt_token.startswith("securegpt-verification="))

    def test_create_department_model(self):
        org_id = str(uuid.uuid4())
        dept = Department(
            id=str(uuid.uuid4()),
            org_id=org_id,
            name="Engineering",
            description="Software Engineering & Devops",
        )
        self.assertEqual(dept.name, "Engineering")
        self.assertEqual(dept.org_id, org_id)

    def test_user_tiered_roles_and_department(self):
        dept_id = str(uuid.uuid4())
        org_id = str(uuid.uuid4())
        user = User(
            id=str(uuid.uuid4()),
            email="developer@acme.com",
            org_id=org_id,
            department_id=dept_id,
            role=UserRole.EMPLOYEE,
        )
        self.assertEqual(user.role, UserRole.EMPLOYEE)
        self.assertEqual(user.department_id, dept_id)
        self.assertEqual(user.org_id, org_id)

    def test_policy_department_scoping_and_actions(self):
        dept_id = str(uuid.uuid4())
        org_id = str(uuid.uuid4())
        policy = Policy(
            id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4()),
            org_id=org_id,
            department_id=dept_id,
            category=PolicyCategory.SECRETS_KEYS,
            action=PolicyAction.BLOCK,
            severity="HIGH",
            config={"rules": ["aws_key"]},
            is_disabled_by_org=False,
        )
        self.assertEqual(policy.action, PolicyAction.BLOCK)
        self.assertEqual(policy.category, PolicyCategory.SECRETS_KEYS)
        self.assertEqual(policy.department_id, dept_id)

    def test_dlp_incident_model(self):
        incident = DLPIncident(
            id=str(uuid.uuid4()),
            org_id=str(uuid.uuid4()),
            department_id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4()),
            policy_id=str(uuid.uuid4()),
            target_app="ChatGPT",
            action_taken=PolicyAction.BLOCK,
            severity="HIGH",
            redacted_snippet="My key: sk-proj-*******************",
        )
        self.assertEqual(incident.target_app, "ChatGPT")
        self.assertEqual(incident.action_taken, PolicyAction.BLOCK)


if __name__ == "__main__":
    unittest.main()
