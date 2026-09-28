"""
Script to clear the local database and seed it with a rich test environment:
- admin@blackvector.online (Org Admin of BlackVector Cyber Defense)
- employee@blackvector.online (Employee with 50+ DLP audit logs & department assignment)
- personal@gmail.com (Individual/Personal tier user with standalone logs)
- Full 30-day telemetry (250+ events), Incidents, Policies, Departments, and Enrolled Devices.
"""
import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from app.core.database import AsyncSessionLocal
from app.models.org import Organisation, OrgStatus
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.policy import Policy, PolicyAction
from app.models.audit_log import AuditLog
from app.models.dlp_incident import DLPIncident
from app.models.device import Device
from app.models.session import Session
from app.models.auth_event import AuthEvent
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
from app.services.org_service import generate_dns_txt_token
from app.commands.reset_and_seed_test_data import DEPARTMENTS_DATA, ADDITIONAL_TEAM
from app.commands.reset_and_seed_telemetry import generate_telemetry_logs
from app.commands.reset_and_seed_entities import create_test_policies, create_test_devices


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

    print("🔐 Seeding RBAC Permissions & Roles...")
    await seed_rbac()

    async with AsyncSessionLocal() as db:
        print("🏢 Creating BlackVector Enterprise Organisation...")
        org_domain = "blackvector.online"
        bv_org = Organisation(
            id=str(uuid.uuid4()),
            name="BlackVector Cyber Defense",
            domain=org_domain,
            admin_email=f"admin@{org_domain}",
            status=OrgStatus.ACTIVE,
            dns_txt_token=generate_dns_txt_token(),
            plan="enterprise",
            is_active=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=90),
        )
        db.add(bv_org)
        await db.flush()

        dept_map = {}
        for d in DEPARTMENTS_DATA:
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

        now = datetime.now(timezone.utc)
        print("👥 Seeding Test User Accounts...")
        admin_user = User(
            id=str(uuid.uuid4()), email=f"admin@{org_domain}", full_name="Anshul (BlackVector Admin)",
            role=UserRole.ORG_ADMIN, is_active=True, privacy_accepted=True, org_id=bv_org.id,
            department_id=dept_map["Security & SecOps"].id, created_at=now - timedelta(days=45),
            last_login_at=now - timedelta(minutes=15),
        )
        db.add(admin_user)

        employee_user = User(
            id=str(uuid.uuid4()), email=f"employee@{org_domain}", full_name="Alex Mercer (Engineering Lead)",
            role=UserRole.EMPLOYEE, is_active=True, privacy_accepted=True, org_id=bv_org.id,
            department_id=dept_map["Engineering & AI Lab"].id, created_at=now - timedelta(days=40),
            last_login_at=now - timedelta(hours=2),
        )
        db.add(employee_user)

        personal_user = User(
            id=str(uuid.uuid4()), email="personal@gmail.com", full_name="Personal Test User",
            role=UserRole.USER, is_active=True, privacy_accepted=True, org_id=None, department_id=None,
            created_at=now - timedelta(days=30), last_login_at=now - timedelta(hours=5),
        )
        db.add(personal_user)

        team_users = {}
        for m in ADDITIONAL_TEAM:
            email = f"{m['prefix']}@{org_domain}"
            u = User(
                id=str(uuid.uuid4()), email=email, full_name=m["name"], role=m["role"],
                is_active=True, privacy_accepted=True, org_id=bv_org.id,
                department_id=dept_map[m["dept"]].id,
                created_at=now - timedelta(days=random.randint(20, 50)),
                last_login_at=now - timedelta(hours=random.randint(1, 48)),
            )
            db.add(u)
            team_users[email] = u
        await db.flush()

        print("🛡️ Seeding Departmental DLP Policies...")
        g_pol, eng_pol, fin_pol, p_pol = create_test_policies(
            admin_user.id, personal_user.id, bv_org.id, dept_map, now
        )
        db.add_all([g_pol, eng_pol, fin_pol, p_pol])
        await db.flush()

        print("💻 Seeding Enrolled Devices...")
        devices = create_test_devices(
            admin_user.id, employee_user.id, personal_user.id, team_users, bv_org.id, org_domain, now
        )
        db.add_all(devices)
        await db.flush()

        print("🚨 Seeding Active DLP Incidents & Alerts...")
        incidents = [
            DLPIncident(
                id=str(uuid.uuid4()), org_id=bv_org.id, department_id=dept_map["Engineering & AI Lab"].id,
                user_id=employee_user.id, policy_id=eng_pol.id, target_app="ChatGPT",
                action_taken=PolicyAction.BLOCK, severity="CRITICAL",
                redacted_snippet="const client = new OpenAI({ apiKey: '[OPENAI_API_KEY-REDACTED]' });",
                override_reason=None, created_at=now - timedelta(hours=3),
            ),
            DLPIncident(
                id=str(uuid.uuid4()), org_id=bv_org.id, department_id=dept_map["Engineering & AI Lab"].id,
                user_id=employee_user.id, policy_id=eng_pol.id, target_app="Claude",
                action_taken=PolicyAction.BLOCK, severity="HIGH",
                redacted_snippet="export AWS_SECRET_ACCESS_KEY='[AWS_SECRET-REDACTED]'",
                override_reason="Attempted prompt debugging on Claude AI", created_at=now - timedelta(hours=18),
            ),
            DLPIncident(
                id=str(uuid.uuid4()), org_id=bv_org.id, department_id=dept_map["Finance & Operations"].id,
                user_id=team_users[f"elena.rostova@{org_domain}"].id, policy_id=fin_pol.id, target_app="Perplexity",
                action_taken=PolicyAction.BLOCK, severity="HIGH",
                redacted_snippet="Please analyze invoice containing IBAN: [IBAN-REDACTED] and SWIFT: [SWIFT-REDACTED]",
                override_reason=None, created_at=now - timedelta(days=1, hours=4),
            ),
            DLPIncident(
                id=str(uuid.uuid4()), org_id=bv_org.id, department_id=dept_map["Security & SecOps"].id,
                user_id=admin_user.id, policy_id=g_pol.id, target_app="DeepSeek",
                action_taken=PolicyAction.MASK, severity="MEDIUM",
                redacted_snippet="Audit log incident for employee email: [EMAIL-REDACTED] with phone: [PHONE-REDACTED]",
                override_reason=None, created_at=now - timedelta(days=2, hours=8),
            ),
        ]
        db.add_all(incidents)
        await db.flush()

        print("📊 Generating 260+ Rich 30-Day Telemetry Logs...")
        target_users = [
            {"user": admin_user, "org_id": bv_org.id, "count": 35},
            {"user": employee_user, "org_id": bv_org.id, "count": 65},
            {"user": personal_user, "org_id": None, "count": 40},
            {"user": team_users[f"sarah.connor@{org_domain}"], "org_id": bv_org.id, "count": 40},
            {"user": team_users[f"marcus.vance@{org_domain}"], "org_id": bv_org.id, "count": 30},
            {"user": team_users[f"elena.rostova@{org_domain}"], "org_id": bv_org.id, "count": 25},
            {"user": team_users[f"david.ops@{org_domain}"], "org_id": bv_org.id, "count": 15},
            {"user": team_users[f"sophia.pm@{org_domain}"], "org_id": bv_org.id, "count": 15},
        ]

        logs = generate_telemetry_logs(target_users, now)
        db.add_all(logs)

        await db.commit()
        print(f"✨ Successfully committed {len(logs)} audit logs across 30 days!")
        print("🎉 LOCAL DATABASE RESET & SEEDING COMPLETED!")


if __name__ == "__main__":
    asyncio.run(seed_test_database())
