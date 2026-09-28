"""
Admin Organization service queries and telemetry serialization.
"""
from typing import Optional
from sqlalchemy import select, func, or_
from app.models.org import Organisation, OrgStatus
from app.models.user import User
from app.models.department import Department


async def fetch_admin_orgs_with_telemetry(
    db, search: Optional[str], status: Optional[OrgStatus], limit: int, offset: int
):
    stmt = select(Organisation)
    if search:
        search_filter = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Organisation.name).like(search_filter),
                func.lower(Organisation.domain).like(search_filter),
                func.lower(Organisation.admin_email).like(search_filter)
            )
        )

    if status:
        stmt = stmt.where(Organisation.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count_res = await db.execute(count_stmt)
    total = total_count_res.scalar_one()

    stmt = stmt.order_by(Organisation.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(stmt)
    orgs = res.scalars().all()

    org_items = []
    for org in orgs:
        u_count_res = await db.execute(
            select(
                func.count(User.id).label("total_users"),
                func.count(User.id).filter(User.is_active.is_(True)).label("active_users")
            ).where(User.org_id == org.id)
        )
        u_row = u_count_res.first()
        total_users = u_row[0] if u_row else 0
        active_users = u_row[1] if u_row else 0

        dept_count_res = await db.execute(
            select(func.count(Department.id)).where(Department.org_id == org.id)
        )
        dept_count = dept_count_res.scalar_one()

        org_items.append({
            "id": org.id,
            "name": org.name,
            "domain": org.domain,
            "admin_email": org.admin_email,
            "status": org.status.value if hasattr(org.status, "value") else str(org.status),
            "plan": org.plan,
            "is_active": org.is_active,
            "dns_txt_token": org.dns_txt_token,
            "domain_verified_at": org.domain_verified_at.isoformat() if org.domain_verified_at else None,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "user_count": total_users,
            "active_user_count": active_users,
            "department_count": dept_count,
        })

    return org_items, total
