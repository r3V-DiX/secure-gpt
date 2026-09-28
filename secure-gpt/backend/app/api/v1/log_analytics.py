"""
Dashboard analytics, leaderboard aggregations, and stats query helpers.
"""
from collections import defaultdict
from datetime import timedelta
from sqlalchemy import select, func, desc, or_
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.org import Organisation
from app.models.department import Department
from app.models.rbac import UserRoleAssignment, Role

PALETTE = ["#ef4444", "#f59e0b", "#6366f1", "#10b981", "#8b5cf6"]


async def check_is_super_admin(db, current_user):
    role_str = (current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)).lower()
    if role_str in ("super_admin", "platform_super_admin"):
        return True
    super_role_res = await db.execute(
        select(Role)
        .join(UserRoleAssignment, UserRoleAssignment.role_id == Role.id)
        .where(
            UserRoleAssignment.user_id == current_user.id,
            UserRoleAssignment.is_active == True,
            Role.slug.in_(("super_admin", "platform_super_admin")),
        )
    )
    return bool(super_role_res.scalar_one_or_none())


async def aggregate_dashboard_metrics(db, where, since, days):
    action_rows = await db.execute(
        select(AuditLog.action_taken, func.count().label("cnt"))
        .where(*where)
        .group_by(AuditLog.action_taken)
    )
    action_counts = {row.action_taken.value: row.cnt for row in action_rows}

    total_result = await db.execute(select(func.count()).where(*where))
    total = total_result.scalar_one()

    domain_rows = await db.execute(
        select(AuditLog.domain, func.count().label("cnt"))
        .where(*where, AuditLog.domain.isnot(None))
        .group_by(AuditLog.domain)
        .order_by(desc("cnt"))
        .limit(8)
    )
    top_domains = [{"domain": r.domain, "count": r.cnt} for r in domain_rows]

    entity_result = await db.execute(select(AuditLog.entity_types).where(*where).limit(10_000))
    entity_counts = {}
    for (entity_types,) in entity_result:
        for et in (entity_types or []):
            entity_counts[et] = entity_counts.get(et, 0) + 1

    top_entity_types = sorted(
        [{"type": k, "count": v} for k, v in entity_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:8]

    day_result = await db.execute(select(AuditLog.timestamp).where(*where))
    day_counts = defaultdict(int)
    for (ts,) in day_result:
        day_counts[ts.strftime("%Y-%m-%d")] += 1

    events_by_day = [
        {"date": (since + timedelta(days=i)).strftime("%Y-%m-%d"),
         "count": day_counts.get((since + timedelta(days=i)).strftime("%Y-%m-%d"), 0)}
        for i in range(days)
    ]

    return action_counts, total, top_domains, top_entity_types, events_by_day


async def fetch_leaderboards(db, current_user, is_super_admin, since, role_str):
    top_organizations = []
    top_employees = []
    top_departments = []

    if is_super_admin:
        org_stats_query = (
            select(
                Organisation.id, Organisation.name, Organisation.domain, Organisation.plan,
                func.count(AuditLog.id).label("cnt")
            )
            .join(AuditLog, AuditLog.org_id == Organisation.id)
            .where(AuditLog.timestamp >= since)
            .group_by(Organisation.id, Organisation.name, Organisation.domain, Organisation.plan)
            .order_by(desc("cnt"))
            .limit(5)
        )
        org_rows = (await db.execute(org_stats_query)).all()
        max_org_cnt = max([r.cnt for r in org_rows], default=1) or 1
        for idx, r in enumerate(org_rows):
            top_organizations.append({
                "id": r.id, "name": r.name, "domain": r.domain,
                "plan": (r.plan or "enterprise").upper(), "count": r.cnt,
                "percent": min(100, int((r.cnt / max_org_cnt) * 100)),
                "color": PALETTE[idx % len(PALETTE)],
            })

        dept_stats_query = (
            select(Department.name, func.count(AuditLog.id).label("cnt"))
            .join(User, User.department_id == Department.id)
            .join(AuditLog, AuditLog.user_id == User.id)
            .where(AuditLog.timestamp >= since)
            .group_by(Department.name)
            .order_by(desc("cnt"))
            .limit(5)
        )
        dept_rows = (await db.execute(dept_stats_query)).all()
        max_dept_cnt = max([r.cnt for r in dept_rows], default=1) or 1
        for idx, r in enumerate(dept_rows):
            top_departments.append({
                "name": r.name, "count": r.cnt,
                "percent": min(100, int((r.cnt / max_dept_cnt) * 100)),
                "action": "Platform Threat Detections", "color": PALETTE[idx % len(PALETTE)],
            })
    elif current_user.org_id:
        is_org_admin = role_str in ("org_admin", "employer", "security_admin")
        if not is_org_admin:
            org_admin_role_res = await db.execute(
                select(Role)
                .join(UserRoleAssignment, UserRoleAssignment.role_id == Role.id)
                .where(
                    UserRoleAssignment.user_id == current_user.id,
                    UserRoleAssignment.is_active == True,
                    Role.slug.in_(("org_admin", "employer", "security_admin")),
                )
            )
            if org_admin_role_res.scalar_one_or_none():
                is_org_admin = True

        if is_org_admin:
            emp_stats_query = (
                select(
                    User.email, User.full_name, Department.name.label("department_name"),
                    func.count(AuditLog.id).label("cnt")
                )
                .join(AuditLog, AuditLog.user_id == User.id)
                .outerjoin(Department, Department.id == User.department_id)
                .where(AuditLog.timestamp >= since, User.org_id == current_user.org_id)
                .group_by(User.email, User.full_name, Department.name)
                .order_by(desc("cnt"))
                .limit(5)
            )
            emp_rows = (await db.execute(emp_stats_query)).all()
            for idx, row in enumerate(emp_rows):
                top_employees.append({
                    "email": row.email,
                    "name": row.full_name or row.email.split("@")[0].replace(".", " ").title(),
                    "dept": row.department_name or "General",
                    "count": row.cnt, "role": "Team Member",
                    "color": PALETTE[idx % len(PALETTE)],
                })

        dept_stats_query = (
            select(Department.name, func.count(AuditLog.id).label("cnt"))
            .join(User, User.department_id == Department.id)
            .join(AuditLog, AuditLog.user_id == User.id)
            .where(AuditLog.timestamp >= since, Department.org_id == current_user.org_id)
            .group_by(Department.name)
            .order_by(desc("cnt"))
            .limit(5)
        )
        dept_rows = (await db.execute(dept_stats_query)).all()
        max_dept_cnt = max([r.cnt for r in dept_rows], default=1) or 1
        for idx, r in enumerate(dept_rows):
            top_departments.append({
                "name": r.name, "count": r.cnt,
                "percent": min(100, int((r.cnt / max_dept_cnt) * 100)),
                "action": "DLP Policy Triggers", "color": PALETTE[idx % len(PALETTE)],
            })

    return top_organizations, top_employees, top_departments
