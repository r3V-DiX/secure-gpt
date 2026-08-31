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
            {"email": f"alex.security@{org_domain}", "name": "Alex Chen", "role": UserRole.SECURITY_ADMIN, "dept": "Security & SecOps"},
            {"email": f"marcus.eng@{org_domain}", "name": "Marcus Vance", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
            {"email": f"priya.dev@{org_domain}", "name": "Priya Sharma", "role": UserRole.EMPLOYEE, "dept": "Engineering & AI Lab"},
            {"email": f"elena.finance@{org_domain}", "name": "Elena Rostova", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
            {"email": f"david.ops@{org_domain}", "name": "David Miller", "role": UserRole.EMPLOYEE, "dept": "Finance & Operations"},
            {"email": f"sophia.pm@{org_domain}", "name": "Sophia Torres", "role": UserRole.EMPLOYEE, "dept": "Product & Growth"},
        ]

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
                    org_id=org.id,
                    department_id=dept_map.get(emp["dept"]),
                )
                db.add(user_obj)
                print(f"  └─ Enrolled Employee: {emp['name']} <{emp['email']}> → {emp['dept']}")
            else:
                user_obj.org_id = org.id
                user_obj.department_id = dept_map.get(emp["dept"])
                user_obj.role = emp["role"]

        # 5. Create Sample Department Custom Policies
        from app.services.extension_service import DEFAULT_POLICY_CONFIG
        import copy

        # Engineering policy: BLOCK Intellectual Property / Code Leaks
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
                print("🛡️ Configured strict IP blocking policy for Engineering & AI Lab")

        # Finance policy: BLOCK Financial & MASK PII
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
                print("🛡️ Configured strict Financial DLP policy for Finance & Operations")

        await db.commit()
        print("✨ BlackVector Enterprise successfully seeded!")
        return org.dns_txt_token


if __name__ == "__main__":
    token = asyncio.run(seed_blackvector())
