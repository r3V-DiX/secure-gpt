"""
Seed script to create the 'BlackVector' enterprise organization,
custom departments, an admin account, and dummy employees.
"""
import asyncio
import uuid
from datetime import datetime, timezone

from app.core.database import AsyncSessionLocal
from app.models.org import Organisation, OrgStatus
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.policy import Policy
from app.services.org_service import generate_dns_txt_token
from sqlalchemy import select


async def seed_blackvector():
    async with AsyncSessionLocal() as db:
        print("🌱 Seeding BlackVector Enterprise organization and users...")

        # 1. Create or fetch BlackVector Organisation
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
            print(f"🔑 DNS TXT Challenge Token: {org.dns_txt_token}")
        else:
            print(f"ℹ️ Organisation already exists: {org.name} (Token: {org.dns_txt_token})")

        # 2. Create Departments
        departments_data = [
            {"name": "Security & SecOps", "description": "Threat hunters, SOC analysts, and security engineers requiring strict zero-leakage DLP."},
            {"name": "Engineering & AI Lab", "description": "Core software engineers and ML researchers working with proprietary models and codebases."},
            {"name": "Finance & Operations", "description": "Accounting and treasury personnel handling payment cards, IBANs, and revenue metrics."},
            {"name": "Product & Growth", "description": "Product management, design, and growth teams interacting with AI daily."},
        ]

        dept_map = {}
        for d in departments_data:
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

        # 3. Create / Update Admin User
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
            print(f"👤 Created Org Admin: {admin_user.email} (Role: {admin_user.role.value})")
        else:
            admin_user.org_id = org.id
            admin_user.role = UserRole.ORG_ADMIN
            admin_user.department_id = dept_map.get("Security & SecOps")
            print(f"🔄 Updated Org Admin: {admin_user.email}")

        # 4. Create Dummy Employees
        employees_data = [
            {"email": f"sarah.connor@{org_domain}", "name": "Sarah Connor", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
            {"email": f"alex.security@{org_domain}", "name": "Alex Chen", "role": UserRole.SECURITY_ADMIN, "dept": "Security & SecOps"},
            {"email": f"marcus.eng@{org_domain}", "name": "Marcus Vance", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
            {"email": f"priya.dev@{org_domain}", "name": "Priya Sharma", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
            {"email": f"elena.finance@{org_domain}", "name": "Elena Rostova", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
            {"email": f"david.ops@{org_domain}", "name": "David Miller", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
            {"email": f"sophia.pm@{org_domain}", "name": "Sophia Torres", "role": UserRole.EMPLOYEE, "dept": "Product & Growth"},
        ]

        employee_user_map = {}
        for emp in employees_data:
            e_res = await db.execute(select(User).where(User.email == emp["email"]))
            user_obj = e_res.scalar_one_or_none()
            if not user_obj:
                user_obj = User(
                    id=str(uuid.uuid4()),
                    email=emp["email"],
                    full_name=emp["name"],
                    role=emp["role"],
                    is_active=True,
                    privacy_accepted=True,
                    org_id=org.id,
                    department_id=dept_map.get(emp["dept"]),
                )
                db.add(user_obj)
                print(f"  └─ Enrolled Employee: {emp['name']} <{emp['email']}> → {emp['dept']}")
            else:
                user_obj.org_id = org.id
                user_obj.department_id = dept_map.get(emp["dept"])
                user_obj.role = emp["role"]
                user_obj.privacy_accepted = True
            await db.flush()
            employee_user_map[emp["email"]] = user_obj

        # 5. Create Sample Department Custom Policies
        from app.services.extension_service import DEFAULT_POLICY_CONFIG
        from app.models.audit_log import AuditLog, ActionType
        import copy
        import random
        from datetime import timedelta

        # Engineering policy: BLOCK Intellectual Property / Code Leaks
        eng_dept_id = dept_map.get("Engineering & AI Lab")
        eng_policy = None
        if eng_dept_id:
            eng_pol_res = await db.execute(
                select(Policy).where(Policy.org_id == org.id, Policy.department_id == eng_dept_id, Policy.is_active == True)
            )
            eng_policy = eng_pol_res.scalar_one_or_none()
            if not eng_policy:
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
                print("🛡️ Configured strict IP blocking policy for Engineering & AI Lab")

        # Finance policy: BLOCK Financial & MASK PII
        fin_dept_id = dept_map.get("Finance & Operations")
        fin_policy = None
        if fin_dept_id:
            fin_pol_res = await db.execute(
                select(Policy).where(Policy.org_id == org.id, Policy.department_id == fin_dept_id, Policy.is_active == True)
            )
            fin_policy = fin_pol_res.scalar_one_or_none()
            if not fin_policy:
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
                print("🛡️ Configured strict Financial DLP policy for Finance & Operations")

        await db.flush()

        # 6. Seed Baseline Audit Logs & Incident Events
        now = datetime.now(timezone.utc)
        incident_counts = {
            f"sarah.connor@{org_domain}": 42,
            f"alex.security@{org_domain}": 29,
            f"marcus.eng@{org_domain}": 24,
            f"david.ops@{org_domain}": 18,
            f"elena.finance@{org_domain}": 15,
            f"priya.dev@{org_domain}": 12,
            f"sophia.pm@{org_domain}": 8,
        }

        platforms = ["ChatGPT", "Claude", "Perplexity", "DeepSeek"]
        domains = ["chatgpt.com", "claude.ai", "perplexity.ai"]

        for email, target_count in incident_counts.items():
            user = employee_user_map.get(email)
            if not user:
                continue

            existing_logs_res = await db.execute(
                select(AuditLog).where(AuditLog.user_id == user.id)
            )
            if len(existing_logs_res.scalars().all()) < 5:
                for i in range(target_count):
                    event_time = now - timedelta(days=random.randint(0, 28), hours=random.randint(0, 23))
                    is_block = (i % 3 == 0)
                    is_mask = (i % 3 == 1)
                    action = ActionType.BLOCK if is_block else (ActionType.MASK if is_mask else ActionType.WARN_ALLOW)

                    dept_name = [k for k, v in dept_map.items() if v == user.department_id]
                    dept_str = dept_name[0] if dept_name else "Engineering & AI Lab"

                    if "Engineering" in dept_str:
                        category = "IP"
                        det_type = "api_key"
                        entity_types = ["github_token", "aws_access_key"]
                    elif "Finance" in dept_str:
                        category = "FINANCIAL"
                        det_type = "credit_card"
                        entity_types = ["credit_card", "iban"]
                    elif "Security" in dept_str:
                        category = "CONFIDENTIAL"
                        det_type = "internal_ip"
                        entity_types = ["private_key", "internal_hostname"]
                    else:
                        category = "PII"
                        det_type = "email"
                        entity_types = ["email", "phone_number"]

        # 7. Seed Additional Organizations for Super Admin Platform Intelligence
        other_orgs_data = [
            {
                "name": "Cyberdyne AI Systems",
                "domain": "cyberdyne.io",
                "plan": "enterprise",
                "admin": "miles.dyson@cyberdyne.io",
                "depts": ["Autonomous Systems", "Neural Research", "Operations"],
                "employees": [
                    {"email": "miles.dyson@cyberdyne.io", "name": "Dr. Miles Dyson", "role": UserRole.ORG_ADMIN, "dept": "Neural Research", "triggers": 45},
                    {"email": "john.cyber@cyberdyne.io", "name": "John Connor", "role": UserRole.EMPLOYEE, "dept": "Autonomous Systems", "triggers": 38},
                    {"email": "tarik.ops@cyberdyne.io", "name": "Tarik Vance", "role": UserRole.EMPLOYEE, "dept": "Operations", "triggers": 22},
                ]
            },
            {
                "name": "AcmeCorp Global",
                "domain": "acmecorp.com",
                "plan": "enterprise",
                "admin": "admin@acmecorp.com",
                "depts": ["Cloud Infrastructure", "Corporate Legal", "Finance"],
                "employees": [
                    {"email": "admin@acmecorp.com", "name": "Acme Admin", "role": UserRole.ORG_ADMIN, "dept": "Cloud Infrastructure", "triggers": 28},
                    {"email": "jane.legal@acmecorp.com", "name": "Jane Legal", "role": UserRole.EMPLOYEE, "dept": "Corporate Legal", "triggers": 21},
                    {"email": "bob.finance@acmecorp.com", "name": "Bob Banker", "role": UserRole.EMPLOYEE, "dept": "Finance", "triggers": 15},
                ]
            },
            {
                "name": "Stark Robotics",
                "domain": "starkrobotics.com",
                "plan": "pro",
                "admin": "admin@starkrobotics.com",
                "depts": ["Applied Defense", "R&D"],
                "employees": [
                    {"email": "pepper.potts@starkrobotics.com", "name": "Pepper Potts", "role": UserRole.ORG_ADMIN, "dept": "Operations", "triggers": 19},
                    {"email": "happy.hogan@starkrobotics.com", "name": "Happy Hogan", "role": UserRole.EMPLOYEE, "dept": "Applied Defense", "triggers": 13},
                ]
            }
        ]

        for org_info in other_orgs_data:
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

            # Create Departments
            o_dept_map = {}
            for dname in org_info["depts"]:
                od_res = await db.execute(select(Department).where(Department.org_id == o_obj.id, Department.name == dname))
                od_obj = od_res.scalar_one_or_none()
                if not od_obj:
                    od_obj = Department(
                        id=str(uuid.uuid4()),
                        org_id=o_obj.id,
                        name=dname,
                    )
                    db.add(od_obj)
                    await db.flush()
                o_dept_map[dname] = od_obj.id

            # Create Employees & Seed Activity
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

                # Logs
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
