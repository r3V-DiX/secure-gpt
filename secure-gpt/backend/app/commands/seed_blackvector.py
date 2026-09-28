"""
Seed script to create the 'BlackVector' enterprise organization,
custom departments, an admin account, and dummy employees.
"""
import asyncio
import copy
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.org import Organisation, OrgStatus
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.policy import Policy
from app.models.audit_log import AuditLog, ActionType
from app.services.org_service import generate_dns_txt_token
from app.services.extension_service import DEFAULT_POLICY_CONFIG
from app.commands.seed_blackvector_data import (
    BLACKVECTOR_DEPARTMENTS,
    BLACKVECTOR_EMPLOYEES,
    OTHER_ORGS_DATA,
)


async def seed_blackvector():
    async with AsyncSessionLocal() as db:
        print("🌱 Seeding BlackVector Enterprise organization and users...")

        org_domain = "blackvector.online"
        res = await db.execute(select(Organisation).where(Organisation.domain == org_domain))
        org = res.scalar_one_or_none()

        if not org:
            dns_token = generate_dns_txt_token()
            org = Organisation(
                id=str(uuid.uuid4()),
                name="BlackVector Cyber Defense",
                domain=org_domain,
                admin_email=f"admin@{org_domain}",
                status=OrgStatus.PENDING_VERIFICATION,
                dns_txt_token=dns_token,
                plan="enterprise",
                is_active=True,
            )
            db.add(org)
            await db.flush()
            print(f"✅ Created Organisation: {org.name} (domain: {org.domain})")
        else:
            print(f"ℹ️ Organisation already exists: {org.name}")

        dept_map = {}
        for d in BLACKVECTOR_DEPARTMENTS:
            d_res = await db.execute(
                select(Department).where(Department.org_id == org.id, Department.name == d["name"])
            )
            dept = d_res.scalar_one_or_none()
            if not dept:
                dept = Department(
                    id=str(uuid.uuid4()),
                    org_id=org.id,
                    name=d["name"],
                    description=d["description"],
                )
                db.add(dept)
                await db.flush()
                print(f"📁 Created Department: {dept.name}")
            dept_map[d["name"]] = dept.id

        admin_email = f"admin@{org_domain}"
        adm_res = await db.execute(select(User).where(User.email == admin_email))
        admin_user = adm_res.scalar_one_or_none()

        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                email=admin_email,
                full_name="Anshul (BlackVector Admin)",
                role=UserRole.ORG_ADMIN,
                is_active=True,
                org_id=org.id,
                department_id=dept_map.get("Security & SecOps"),
            )
            db.add(admin_user)
            print(f"👤 Created Org Admin: {admin_user.email}")
        else:
            admin_user.org_id = org.id
            admin_user.role = UserRole.ORG_ADMIN
            admin_user.department_id = dept_map.get("Security & SecOps")

        for emp in BLACKVECTOR_EMPLOYEES:
            email = f"{emp['prefix']}@{org_domain}"
            e_res = await db.execute(select(User).where(User.email == email))
            user_obj = e_res.scalar_one_or_none()
            if not user_obj:
                user_obj = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    full_name=emp["name"],
                    role=emp["role"],
                    is_active=True,
                    privacy_accepted=True,
                    org_id=org.id,
                    department_id=dept_map.get(emp["dept"]),
                )
                db.add(user_obj)
            else:
                user_obj.org_id = org.id
                user_obj.department_id = dept_map.get(emp["dept"])
                user_obj.role = emp["role"]
                user_obj.privacy_accepted = True
            await db.flush()

        eng_dept_id = dept_map.get("Engineering & AI Lab")
        if eng_dept_id:
            eng_pol_res = await db.execute(
                select(Policy).where(Policy.org_id == org.id, Policy.department_id == eng_dept_id, Policy.is_active == True)
            )
            if not eng_pol_res.scalar_one_or_none():
                eng_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
                eng_config["categories"]["IP"]["action"] = "BLOCK"
                eng_config["categories"]["IP"]["customKeywords"] = ["ghp_", "AKIA", "BEGIN RSA PRIVATE KEY", "sk-proj-"]
                eng_policy = Policy(
                    user_id=admin_user.id,
                    org_id=org.id,
                    department_id=eng_dept_id,
                    config=eng_config,
                    version=1,
                    is_active=True,
                    published_at=datetime.now(timezone.utc),
                )
                db.add(eng_policy)

        fin_dept_id = dept_map.get("Finance & Operations")
        if fin_dept_id:
            fin_pol_res = await db.execute(
                select(Policy).where(Policy.org_id == org.id, Policy.department_id == fin_dept_id, Policy.is_active == True)
            )
            if not fin_pol_res.scalar_one_or_none():
                fin_config = copy.deepcopy(DEFAULT_POLICY_CONFIG)
                fin_config["categories"]["FINANCIAL"]["action"] = "BLOCK"
                fin_config["categories"]["FINANCIAL"]["customKeywords"] = ["IBAN", "SWIFT", "Wire Transfer", "Q3 Financials"]
                fin_policy = Policy(
                    user_id=admin_user.id,
                    org_id=org.id,
                    department_id=fin_dept_id,
                    config=fin_config,
                    version=1,
                    is_active=True,
                    published_at=datetime.now(timezone.utc),
                )
                db.add(fin_policy)

        await db.flush()

        platforms = ["ChatGPT", "Claude", "Perplexity", "DeepSeek"]
        domains = ["chatgpt.com", "claude.ai", "perplexity.ai"]
        now = datetime.now(timezone.utc)

        for org_info in OTHER_ORGS_DATA:
            o_res = await db.execute(select(Organisation).where(Organisation.domain == org_info["domain"]))
            o_obj = o_res.scalar_one_or_none()
            if not o_obj:
                o_obj = Organisation(
                    id=str(uuid.uuid4()),
                    name=org_info["name"],
                    domain=org_info["domain"],
                    admin_email=org_info["admin"],
                    status=OrgStatus.ACTIVE,
                    dns_txt_token=generate_dns_txt_token(),
                    plan=org_info["plan"],
                    is_active=True,
                )
                db.add(o_obj)
                await db.flush()
                print(f"🏢 Created Multi-Tenant Organisation: {o_obj.name} ({o_obj.domain})")

            o_dept_map = {}
            for dname in org_info["depts"]:
                od_res = await db.execute(select(Department).where(Department.org_id == o_obj.id, Department.name == dname))
                od_obj = od_res.scalar_one_or_none()
                if not od_obj:
                    od_obj = Department(id=str(uuid.uuid4()), org_id=o_obj.id, name=dname)
                    db.add(od_obj)
                    await db.flush()
                o_dept_map[dname] = od_obj.id

            for emp in org_info["employees"]:
                eu_res = await db.execute(select(User).where(User.email == emp["email"]))
                eu_obj = eu_res.scalar_one_or_none()
                dept_id = o_dept_map.get(emp["dept"]) or list(o_dept_map.values())[0]
                if not eu_obj:
                    eu_obj = User(
                        id=str(uuid.uuid4()),
                        email=emp["email"],
                        full_name=emp["name"],
                        role=emp["role"],
                        is_active=True,
                        privacy_accepted=True,
                        org_id=o_obj.id,
                        department_id=dept_id,
                    )
                    db.add(eu_obj)
                    await db.flush()
                else:
                    eu_obj.org_id = o_obj.id
                    eu_obj.department_id = dept_id

                elogs_res = await db.execute(select(AuditLog).where(AuditLog.user_id == eu_obj.id))
                if len(elogs_res.scalars().all()) < 3:
                    for i in range(emp["triggers"]):
                        event_time = now - timedelta(days=random.randint(0, 28), hours=random.randint(0, 23))
                        is_block = (i % 2 == 0)
                        log_entry = AuditLog(
                            id=str(uuid.uuid4()),
                            event_id=f"seed-{eu_obj.id[:8]}-{i}-{uuid.uuid4().hex[:6]}",
                            user_id=eu_obj.id,
                            user_email=eu_obj.email,
                            org_id=o_obj.id,
                            action_taken=ActionType.BLOCK if is_block else ActionType.MASK,
                            category_triggered="IP" if "Research" in emp["dept"] or "Defense" in emp["dept"] else "PII",
                            detection_type="api_key" if is_block else "email",
                            detection_tier="regex",
                            llm_platform=random.choice(platforms),
                            domain=random.choice(domains),
                            match_count=1,
                            entity_types=["api_key", "secret_key"] if is_block else ["email"],
                            severities=["HIGH" if is_block else "MEDIUM"],
                            timestamp=event_time,
                        )
                        db.add(log_entry)

        await db.commit()
        print("✨ Multi-Tenant Enterprise & Employee Activity successfully seeded!")
        return org.dns_txt_token


if __name__ == "__main__":
    token = asyncio.run(seed_blackvector())
