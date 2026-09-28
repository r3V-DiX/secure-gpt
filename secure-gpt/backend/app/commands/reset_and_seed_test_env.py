"""
Script to clear the local database and seed it with a rich test environment:
- admin@blackvector.online (Org Admin of BlackVector Cyber Defense)
- employee@blackvector.online (Employee with 50+ DLP audit logs & department assignment)
- personal@gmail.com (Individual/Personal tier user with standalone logs)
- Full 30-day telemetry (250+ events), Incidents, Policies, Departments, and Enrolled Devices.
"""
import asyncio
import copy
import hashlib
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select, text
from app.core.database import AsyncSessionLocal, Base, engine
from app.models.org import Organisation, OrgStatus
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.policy import Policy, PolicyAction, PolicyCategory
from app.models.audit_log import AuditLog, ActionType, SeverityLevel
from app.models.dlp_incident import DLPIncident
from app.models.device import Device
from app.models.session import Session
from app.models.auth_event import AuthEvent, AuthEventType
from app.models.org_invitation import OrgInvitation
from app.models.otp_code import OTPCode
from app.models.deleted_user_log import DeletedUserLog
from app.models.rbac import (
    AdminAuditLog,
    Role,
    Permission,
    RolePermission,
    UserRoleAssignment,
)
from app.commands.seed_rbac import seed_rbac
from app.services.extension_service import DEFAULT_POLICY_CONFIG
from app.services.org_service import generate_dns_txt_token


def make_hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


async def clear_database(db):
    print("🧹 Wiping existing database tables...")
    await db.execute(delete(AdminAuditLog))
    await db.execute(delete(RolePermission))
    await db.execute(delete(UserRoleAssignment))
    await db.execute(delete(Permission))
    await db.execute(delete(Role))
    await db.execute(delete(DLPIncident))
    await db.execute(delete(AuditLog))
    await db.execute(delete(Device))
    await db.execute(delete(Session))
    await db.execute(delete(AuthEvent))
    await db.execute(delete(DeletedUserLog))
    await db.execute(delete(OTPCode))
    await db.execute(delete(OrgInvitation))
    await db.execute(delete(Policy))
    await db.execute(delete(User))
    await db.execute(delete(Department))
    await db.execute(delete(Organisation))
    await db.commit()
    print("✅ All tables cleared successfully.")


async def seed_test_database():
    async with AsyncSessionLocal() as db:
        await clear_database(db)

    # 1. Seed RBAC permissions & base system roles
    print("🔐 Seeding RBAC Permissions & Roles...")
    await seed_rbac()

    async with AsyncSessionLocal() as db:
        # 2. Create BlackVector Cyber Defense Organisation
        print("🏢 Creating BlackVector Enterprise Organisation...")
        org_domain = "blackvector.online"
        dns_token = generate_dns_txt_token()
        bv_org = Organisation(
            id=str(uuid.uuid4()),
            name="BlackVector Cyber Defense",
            domain=org_domain,
            admin_email=f"admin@{org_domain}",
            status=OrgStatus.ACTIVE,
            dns_txt_token=dns_token,
            plan="enterprise",
            is_active=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=90),
        )
        db.add(bv_org)
        await db.flush()

        # 3. Create Departments for BlackVector
        departments_data = [
            {
                "name": "Security & SecOps",
                "description": "Threat hunters, SOC analysts, and security engineers requiring strict zero-leakage DLP.",
            },
            {
                "name": "Engineering & AI Lab",
                "description": "Core software engineers and ML researchers working with proprietary models and codebases.",
            },
            {
                "name": "Finance & Operations",
                "description": "Accounting and treasury personnel handling payment cards, IBANs, and revenue metrics.",
            },
            {
                "name": "Product & Growth",
                "description": "Product management, design, and growth teams interacting with AI daily.",
            },
        ]

        dept_map = {}
        for d in departments_data:
            dept = Department(
                id=str(uuid.uuid4()),
                org_id=bv_org.id,
                name=d["name"],
                description=d["description"],
                created_at=datetime.now(timezone.utc) - timedelta(days=60),
            )
            db.add(dept)
            await db.flush()
            dept_map[d["name"]] = dept
            print(f"  📁 Department: {dept.name}")

        now = datetime.now(timezone.utc)

        # 4. Create Key User Accounts
        print("👥 Seeding Test User Accounts...")

        admin_user = User(
            id=str(uuid.uuid4()),
            email=f"admin@{org_domain}",
            full_name="Anshul (BlackVector Admin)",
            role=UserRole.ORG_ADMIN,
            is_active=True,
            privacy_accepted=True,
            org_id=bv_org.id,
            department_id=dept_map["Security & SecOps"].id,
            created_at=now - timedelta(days=45),
            last_login_at=now - timedelta(minutes=15),
        )
        db.add(admin_user)

        employee_user = User(
            id=str(uuid.uuid4()),
            email=f"employee@{org_domain}",
            full_name="Alex Mercer (Engineering Lead)",
            role=UserRole.EMPLOYEE,
            is_active=True,
            privacy_accepted=True,
            org_id=bv_org.id,
            department_id=dept_map["Engineering & AI Lab"].id,
            created_at=now - timedelta(days=40),
            last_login_at=now - timedelta(hours=2),
        )
        db.add(employee_user)

        personal_user = User(
            id=str(uuid.uuid4()),
            email="personal@gmail.com",
            full_name="Personal Test User",
            role=UserRole.USER,
            is_active=True,
            privacy_accepted=True,
            org_id=None,
            department_id=None,
            created_at=now - timedelta(days=30),
            last_login_at=now - timedelta(hours=5),
        )
        db.add(personal_user)

        additional_team = [
            {"email": f"sarah.connor@{org_domain}", "name": "Sarah Connor", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
            {"email": f"marcus.vance@{org_domain}", "name": "Marcus Vance", "role": UserRole.EMPLOYEE, "dept": "Security & SecOps"},
            {"email": f"elena.rostova@{org_domain}", "name": "Elena Rostova", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
            {"email": f"david.ops@{org_domain}", "name": "David Miller", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
            {"email": f"sophia.pm@{org_domain}", "name": "Sophia Torres", "role": UserRole.EMPLOYEE, "dept": "Product & Growth"},
        ]

        team_users = {}
        for member in additional_team:
            u = User(
                id=str(uuid.uuid4()),
                email=member["email"],
                full_name=member["name"],
                role=member["role"],
                is_active=True,
                privacy_accepted=True,
                org_id=bv_org.id,
                department_id=dept_map[member["dept"]].id,
                created_at=now - timedelta(days=random.randint(20, 50)),
                last_login_at=now - timedelta(hours=random.randint(1, 48)),
            )
            db.add(u)
            team_users[member["email"]] = u

        await db.flush()
        print(f"  👤 Org Admin: {admin_user.email}")
        print(f"  👤 Employee:  {employee_user.email}")
        print(f"  👤 Personal:  {personal_user.email}")

        # 5. Seed Departmental DLP Policies
        print("🛡️ Seeding Departmental DLP Policies...")
        global_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
        global_policy = Policy(
            id=str(uuid.uuid4()),
            user_id=admin_user.id,
            org_id=bv_org.id,
            department_id=None,
            category=PolicyCategory.PII,
            action=PolicyAction.BLOCK,
            severity="HIGH",
            config=global_config,
            version=1,
            is_active=True,
            published_at=now - timedelta(days=30),
            created_at=now - timedelta(days=30),
        )
        db.add(global_policy)

        eng_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
        eng_config["categories"]["IP"]["action"] = "BLOCK"
        eng_config["categories"]["IP"]["customKeywords"] = [
            "ghp_", "AKIA", "BEGIN RSA PRIVATE KEY", "sk-proj-", "nvapi-", "BV_INTERNAL_PROD_SECRET"
        ]
        eng_policy = Policy(
            id=str(uuid.uuid4()),
            user_id=admin_user.id,
            org_id=bv_org.id,
            department_id=dept_map["Engineering & AI Lab"].id,
            category=PolicyCategory.SOURCE_CODE,
            action=PolicyAction.BLOCK,
            severity="CRITICAL",
            config=eng_config,
            version=1,
            is_active=True,
            published_at=now - timedelta(days=25),
            created_at=now - timedelta(days=25),
        )
        db.add(eng_policy)

        fin_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
        fin_config["categories"]["FINANCIAL"]["action"] = "BLOCK"
        fin_config["categories"]["FINANCIAL"]["customKeywords"] = [
            "IBAN", "SWIFT", "Wire Transfer", "Q3 Financials", "Tax ID", "Salary Band"
        ]
        fin_policy = Policy(
            id=str(uuid.uuid4()),
            user_id=admin_user.id,
            org_id=bv_org.id,
            department_id=dept_map["Finance & Operations"].id,
            category=PolicyCategory.FINANCIAL,
            action=PolicyAction.BLOCK,
            severity="HIGH",
            config=fin_config,
            version=1,
            is_active=True,
            published_at=now - timedelta(days=20),
            created_at=now - timedelta(days=20),
        )
        db.add(fin_policy)

        personal_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
        personal_policy = Policy(
            id=str(uuid.uuid4()),
            user_id=personal_user.id,
            org_id=None,
            department_id=None,
            category=PolicyCategory.PII,
            action=PolicyAction.MASK,
            severity="MEDIUM",
            config=personal_config,
            version=1,
            is_active=True,
            published_at=now - timedelta(days=10),
            created_at=now - timedelta(days=10),
        )
        db.add(personal_policy)
        await db.flush()

        # 6. Seed Enrolled Devices
        print("💻 Seeding Enrolled Devices...")
        devices = [
            Device(
                id=str(uuid.uuid4()),
                user_id=admin_user.id,
                org_id=bv_org.id,
                name="Anshul's MacBook Pro (M3 Max)",
                hostname="bv-sec-mbp-01",
                os_platform="macOS 15.0",
                browser="Chrome 128.0",
                extension_version="1.2.0",
                is_active=True,
                created_at=now - timedelta(days=45),
                last_seen_at=now - timedelta(minutes=5),
            ),
            Device(
                id=str(uuid.uuid4()),
                user_id=employee_user.id,
                org_id=bv_org.id,
                name="Alex Engineering ThinkPad",
                hostname="bv-eng-tpad-09",
                os_platform="Ubuntu Linux 24.04",
                browser="Chrome 128.0",
                extension_version="1.2.0",
                is_active=True,
                created_at=now - timedelta(days=35),
                last_seen_at=now - timedelta(minutes=30),
            ),
            Device(
                id=str(uuid.uuid4()),
                user_id=personal_user.id,
                org_id=None,
                name="Personal Desktop (Home)",
                hostname="personal-win11-pc",
                os_platform="Windows 11",
                browser="Chrome 128.0",
                extension_version="1.2.0",
                is_active=True,
                created_at=now - timedelta(days=20),
                last_seen_at=now - timedelta(hours=3),
            ),
            Device(
                id=str(uuid.uuid4()),
                user_id=team_users[f"sarah.connor@{org_domain}"].id,
                org_id=bv_org.id,
                name="Sarah's AI Lab Workstation",
                hostname="bv-ai-rig-03",
                os_platform="macOS 14.6",
                browser="Arc 1.55",
                extension_version="1.2.0",
                is_active=True,
                created_at=now - timedelta(days=25),
                last_seen_at=now - timedelta(hours=1),
            ),
        ]
        for dev in devices:
            db.add(dev)
        await db.flush()

        # 7. Seed DLP Incidents / Alerts
        print("🚨 Seeding Active DLP Incidents & Alerts...")
        incidents_data = [
            {
                "org_id": bv_org.id,
                "dept_id": dept_map["Engineering & AI Lab"].id,
                "user_id": employee_user.id,
                "policy_id": eng_policy.id,
                "target_app": "ChatGPT",
                "action_taken": PolicyAction.BLOCK,
                "severity": "CRITICAL",
                "redacted_snippet": "const client = new OpenAI({ apiKey: '[OPENAI_API_KEY-REDACTED]' });",
                "override_reason": None,
                "created_at": now - timedelta(hours=3),
            },
            {
                "org_id": bv_org.id,
                "dept_id": dept_map["Engineering & AI Lab"].id,
                "user_id": employee_user.id,
                "policy_id": eng_policy.id,
                "target_app": "Claude",
                "action_taken": PolicyAction.BLOCK,
                "severity": "HIGH",
                "redacted_snippet": "export AWS_SECRET_ACCESS_KEY='[AWS_SECRET-REDACTED]'",
                "override_reason": "Attempted prompt debugging on Claude AI",
                "created_at": now - timedelta(hours=18),
            },
            {
                "org_id": bv_org.id,
                "dept_id": dept_map["Finance & Operations"].id,
                "user_id": team_users[f"elena.rostova@{org_domain}"].id,
                "policy_id": fin_policy.id,
                "target_app": "Perplexity",
                "action_taken": PolicyAction.BLOCK,
                "severity": "HIGH",
                "redacted_snippet": "Please analyze invoice containing IBAN: [IBAN-REDACTED] and SWIFT: [SWIFT-REDACTED]",
                "override_reason": None,
                "created_at": now - timedelta(days=1, hours=4),
            },
            {
                "org_id": bv_org.id,
                "dept_id": dept_map["Security & SecOps"].id,
                "user_id": admin_user.id,
                "policy_id": global_policy.id,
                "target_app": "DeepSeek",
                "action_taken": PolicyAction.MASK,
                "severity": "MEDIUM",
                "redacted_snippet": "Audit log incident for employee email: [EMAIL-REDACTED] with phone: [PHONE-REDACTED]",
                "override_reason": None,
                "created_at": now - timedelta(days=2, hours=8),
            },
        ]
        for inc in incidents_data:
            incident = DLPIncident(
                id=str(uuid.uuid4()),
                org_id=inc["org_id"],
                department_id=inc["dept_id"],
                user_id=inc["user_id"],
                policy_id=inc["policy_id"],
                target_app=inc["target_app"],
                action_taken=inc["action_taken"],
                severity=inc["severity"],
                redacted_snippet=inc["redacted_snippet"],
                override_reason=inc["override_reason"],
                created_at=inc["created_at"],
            )
            db.add(incident)
        await db.flush()

        # 8. Seed 250+ Rich 30-Day Audit Logs
        print("📊 Generating 260+ Rich 30-Day Telemetry Logs...")

        platforms = [
            {"name": "ChatGPT", "domain": "chatgpt.com"},
            {"name": "Claude", "domain": "claude.ai"},
            {"name": "Perplexity", "domain": "perplexity.ai"},
            {"name": "DeepSeek", "domain": "deepseek.com"},
        ]

        detection_scenarios = [
            {
                "cat": "IP",
                "det_type": "api_key",
                "tier": "regex",
                "entities": ["openai_api_key", "aws_secret_key"],
                "severities": ["CRITICAL"],
                "actions": [ActionType.BLOCK, ActionType.BLOCK, ActionType.MASK],
            },
            {
                "cat": "IP",
                "det_type": "github_token",
                "tier": "regex",
                "entities": ["github_pat"],
                "severities": ["HIGH"],
                "actions": [ActionType.BLOCK, ActionType.MASK],
            },
            {
                "cat": "IP",
                "det_type": "private_key",
                "tier": "regex",
                "entities": ["rsa_private_key"],
                "severities": ["CRITICAL"],
                "actions": [ActionType.BLOCK],
            },
            {
                "cat": "FINANCIAL",
                "det_type": "credit_card",
                "tier": "regex",
                "entities": ["visa_credit_card", "mastercard_credit_card"],
                "severities": ["HIGH"],
                "actions": [ActionType.BLOCK, ActionType.MASK, ActionType.WARN_ALLOW],
            },
            {
                "cat": "FINANCIAL",
                "det_type": "iban",
                "tier": "regex",
                "entities": ["iban_code"],
                "severities": ["HIGH"],
                "actions": [ActionType.BLOCK, ActionType.MASK],
            },
            {
                "cat": "FINANCIAL",
                "det_type": "pan_card",
                "tier": "ocr",
                "entities": ["indian_pan_card"],
                "severities": ["HIGH"],
                "actions": [ActionType.BLOCK, ActionType.MASK],
            },
            {
                "cat": "PII",
                "det_type": "aadhaar",
                "tier": "regex",
                "entities": ["aadhaar_number"],
                "severities": ["HIGH"],
                "actions": [ActionType.BLOCK, ActionType.MASK],
            },
            {
                "cat": "PII",
                "det_type": "ssn",
                "tier": "regex",
                "entities": ["us_ssn"],
                "severities": ["CRITICAL"],
                "actions": [ActionType.BLOCK, ActionType.MASK],
            },
            {
                "cat": "PII",
                "det_type": "person_name",
                "tier": "ner",
                "entities": ["person_name", "job_title"],
                "severities": ["MEDIUM"],
                "actions": [ActionType.MASK, ActionType.WARN_ALLOW, ActionType.ALLOW],
            },
            {
                "cat": "PII",
                "det_type": "email",
                "tier": "regex",
                "entities": ["email_address", "phone_number"],
                "severities": ["LOW", "MEDIUM"],
                "actions": [ActionType.MASK, ActionType.WARN_ALLOW],
            },
            {
                "cat": "CONFIDENTIAL",
                "det_type": "jwt_token",
                "tier": "regex",
                "entities": ["jwt_session_token"],
                "severities": ["HIGH"],
                "actions": [ActionType.BLOCK, ActionType.MASK],
            },
            {
                "cat": "CONFIDENTIAL",
                "det_type": "internal_ip",
                "tier": "regex",
                "entities": ["internal_ipv4", "internal_hostname"],
                "severities": ["MEDIUM"],
                "actions": [ActionType.MASK, ActionType.WARN_ALLOW],
            },
        ]

        all_target_users = [
            {"user": admin_user, "org_id": bv_org.id, "count": 35},
            {"user": employee_user, "org_id": bv_org.id, "count": 65},
            {"user": personal_user, "org_id": None, "count": 40},
            {"user": team_users[f"sarah.connor@{org_domain}"], "org_id": bv_org.id, "count": 40},
            {"user": team_users[f"marcus.vance@{org_domain}"], "org_id": bv_org.id, "count": 30},
            {"user": team_users[f"elena.rostova@{org_domain}"], "org_id": bv_org.id, "count": 25},
            {"user": team_users[f"david.ops@{org_domain}"], "org_id": bv_org.id, "count": 15},
            {"user": team_users[f"sophia.pm@{org_domain}"], "org_id": bv_org.id, "count": 15},
        ]

        total_logs = 0
        for target in all_target_users:
            u = target["user"]
            org_id = target["org_id"]
            count = target["count"]

            for i in range(count):
                days_ago = random.choices(
                    [random.randint(0, 3), random.randint(4, 10), random.randint(11, 20), random.randint(21, 29)],
                    weights=[0.4, 0.3, 0.2, 0.1]
                )[0]
                hours_ago = random.randint(0, 23)
                mins_ago = random.randint(0, 59)
                event_time = now - timedelta(days=days_ago, hours=hours_ago, minutes=mins_ago)

                scen = random.choice(detection_scenarios)
                plat = random.choice(platforms)
                action = random.choice(scen["actions"])

                log = AuditLog(
                    id=str(uuid.uuid4()),
                    event_id=f"evt-{u.id[:8]}-{days_ago:02d}{hours_ago:02d}-{uuid.uuid4().hex[:6]}",
                    user_id=u.id,
                    user_email=u.email,
                    org_id=org_id,
                    action_taken=action,
                    category_triggered=scen["cat"],
                    detection_type=scen["det_type"],
                    detection_tier=scen["tier"],
                    llm_platform=plat["name"],
                    domain=plat["domain"],
                    match_count=random.randint(1, 4),
                    snippet_hash=make_hash(f"{u.email}-{event_time}-{scen['det_type']}-{i}"),
                    entity_types=scen["entities"],
                    severities=scen["severities"],
                    timestamp=event_time,
                )
                db.add(log)
                total_logs += 1

        await db.commit()

        print(f"✨ Successfully committed {total_logs} audit logs across 30 days!")
        print("\n" + "=" * 65)
        print("🎉 LOCAL DATABASE RESET & SEEDING COMPLETED!")
        print("=" * 65)
        print(f"🏢 Organisation : BlackVector Cyber Defense (domain: {bv_org.domain})")
        print(f"🔑 DNS Token    : {bv_org.dns_txt_token}")
        print("👥 Test Accounts:")
        print(f"   1. admin@blackvector.online    -> Org Admin (Security & SecOps)")
        print(f"   2. employee@blackvector.online -> Employee (Engineering & AI Lab, 65+ events)")
        print(f"   3. personal@gmail.com          -> Individual/Personal User (40+ standalone events)")
        print(f"📊 Total Telemetry Events : {total_logs}")
        print(f"🚨 Active Incidents & Alerts: {len(incidents_data)}")
        print(f"🛡️ Department Policies     : {len(departments_data)}")
        print(f"💻 Enrolled Devices        : {len(devices)}")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(seed_test_database())
