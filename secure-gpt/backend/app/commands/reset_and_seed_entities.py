"""
Policy and device seed helper for test environment.
"""
import copy
import uuid
from datetime import timedelta
from app.models.policy import Policy, PolicyAction, PolicyCategory
from app.models.device import Device
from app.services.extension_service import DEFAULT_POLICY_CONFIG


def create_test_policies(admin_user_id, personal_user_id, org_id, dept_map, now):
    """Build initial policies for test environment."""
    global_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
    global_policy = Policy(
        id=str(uuid.uuid4()), user_id=admin_user_id, org_id=org_id, department_id=None,
        category=PolicyCategory.PII, action=PolicyAction.BLOCK, severity="HIGH",
        config=global_config, version=1, is_active=True,
        published_at=now - timedelta(days=30), created_at=now - timedelta(days=30),
    )

    eng_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
    eng_config["categories"]["IP"]["action"] = "BLOCK"
    eng_config["categories"]["IP"]["customKeywords"] = [
        "ghp_", "AKIA", "BEGIN RSA PRIVATE KEY", "sk-proj-", "nvapi-", "BV_INTERNAL_PROD_SECRET"
    ]
    eng_policy = Policy(
        id=str(uuid.uuid4()), user_id=admin_user_id, org_id=org_id,
        department_id=dept_map["Engineering & AI Lab"].id,
        category=PolicyCategory.SOURCE_CODE, action=PolicyAction.BLOCK, severity="CRITICAL",
        config=eng_config, version=1, is_active=True,
        published_at=now - timedelta(days=25), created_at=now - timedelta(days=25),
    )

    fin_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
    fin_config["categories"]["FINANCIAL"]["action"] = "BLOCK"
    fin_config["categories"]["FINANCIAL"]["customKeywords"] = [
        "IBAN", "SWIFT", "Wire Transfer", "Q3 Financials", "Tax ID", "Salary Band"
    ]
    fin_policy = Policy(
        id=str(uuid.uuid4()), user_id=admin_user_id, org_id=org_id,
        department_id=dept_map["Finance & Operations"].id,
        category=PolicyCategory.FINANCIAL, action=PolicyAction.BLOCK, severity="HIGH",
        config=fin_config, version=1, is_active=True,
        published_at=now - timedelta(days=20), created_at=now - timedelta(days=20),
    )

    personal_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
    personal_policy = Policy(
        id=str(uuid.uuid4()), user_id=personal_user_id, org_id=None, department_id=None,
        category=PolicyCategory.PII, action=PolicyAction.MASK, severity="MEDIUM",
        config=personal_config, version=1, is_active=True,
        published_at=now - timedelta(days=10), created_at=now - timedelta(days=10),
    )

    return global_policy, eng_policy, fin_policy, personal_policy


def create_test_devices(admin_user_id, employee_user_id, personal_user_id, team_users, org_id, org_domain, now):
    """Build enrolled devices for test environment."""
    return [
        Device(
            id=str(uuid.uuid4()), user_id=admin_user_id, org_id=org_id,
            name="Anshul's MacBook Pro (M3 Max)", hostname="bv-sec-mbp-01",
            os_platform="macOS 15.0", browser="Chrome 128.0", extension_version="1.2.0",
            is_active=True, created_at=now - timedelta(days=45), last_seen_at=now - timedelta(minutes=5),
        ),
        Device(
            id=str(uuid.uuid4()), user_id=employee_user_id, org_id=org_id,
            name="Alex Engineering ThinkPad", hostname="bv-eng-tpad-09",
            os_platform="Ubuntu Linux 24.04", browser="Chrome 128.0", extension_version="1.2.0",
            is_active=True, created_at=now - timedelta(days=35), last_seen_at=now - timedelta(minutes=30),
        ),
        Device(
            id=str(uuid.uuid4()), user_id=personal_user_id, org_id=None,
            name="Personal Desktop (Home)", hostname="personal-win11-pc",
            os_platform="Windows 11", browser="Chrome 128.0", extension_version="1.2.0",
            is_active=True, created_at=now - timedelta(days=20), last_seen_at=now - timedelta(hours=3),
        ),
        Device(
            id=str(uuid.uuid4()), user_id=team_users[f"sarah.connor@{org_domain}"].id, org_id=org_id,
            name="Sarah's AI Lab Workstation", hostname="bv-ai-rig-03",
            os_platform="macOS 14.6", browser="Arc 1.55", extension_version="1.2.0",
            is_active=True, created_at=now - timedelta(days=25), last_seen_at=now - timedelta(hours=1),
        ),
    ]
