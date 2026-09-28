"""
CSV Import/Export and Bulk Operations for Users API.
"""
import csv
import io
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, or_, delete
from app.models.user import User, UserRole
from app.models.department import Department
from app.core.response import success


class BulkUserActionRequest(BaseModel):
    user_ids: List[str]
    action: str
    department_id: Optional[str] = None
    role: Optional[str] = None


async def handle_export_users_csv(db, current_user, search, department_id, role):
    query = select(User)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]:
        if current_user.org_id:
            query = query.where(User.org_id == current_user.org_id)
        else:
            query = query.where(User.id == current_user.id)

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.where(or_(User.email.ilike(search_pattern), User.full_name.ilike(search_pattern)))
    if department_id:
        if department_id == "unassigned":
            query = query.where(User.department_id.is_(None))
        else:
            query = query.where(User.department_id == department_id)
    if role and role.strip():
        query = query.where(func.lower(func.cast(User.role, func.text())) == role.strip().lower())

    result = await db.execute(query.order_by(User.email.asc()))
    users = result.scalars().all()

    depts_res = await db.execute(select(Department))
    dept_map = {d.id: d.name for d in depts_res.scalars().all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["User ID", "Full Name", "Email", "Role", "Department", "Active Status", "Enrolled Date", "Last Login"])

    for u in users:
        role_str = u.role.value if hasattr(u.role, "value") else str(u.role)
        dept_name = dept_map.get(u.department_id, "Unassigned")
        writer.writerow([
            u.id,
            u.full_name or "",
            u.email,
            role_str,
            dept_name,
            "Active" if u.is_active else "Inactive",
            u.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            u.last_login_at.strftime("%Y-%m-%d %H:%M:%S") if u.last_login_at else "Never",
        ])

    output.seek(0)
    filename = f"employees_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


async def handle_import_users_csv(file: UploadFile, db, current_user):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Organization Admins can import employee rosters.")
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="Must belong to an organization to import employees.")

    content = await file.read()
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    dept_res = await db.execute(select(Department).where(Department.org_id == current_user.org_id))
    dept_dict = {d.name.lower().strip(): d.id for d in dept_res.scalars().all()}

    created_count = 0
    updated_count = 0
    errors = []

    for idx, row in enumerate(reader, start=2):
        email = (row.get("Email") or row.get("email") or "").strip().lower()
        full_name = (row.get("Full Name") or row.get("Name") or row.get("name") or "").strip()
        dept_name = (row.get("Department") or row.get("department") or "").strip()
        role_raw = (row.get("Role") or row.get("role") or "employee").strip().lower()

        if not email or "@" not in email:
            errors.append(f"Row {idx}: Invalid or missing email '{email}'")
            continue

        dept_id = dept_dict.get(dept_name.lower()) if dept_name else None
        target_role = UserRole.EMPLOYEE
        if role_raw in ["org_admin", "admin"]:
            target_role = UserRole.ORG_ADMIN
        elif role_raw == "user":
            target_role = UserRole.USER

        user_res = await db.execute(select(User).where(User.email == email))
        user_obj = user_res.scalar_one_or_none()

        if user_obj:
            user_obj.org_id = current_user.org_id
            if full_name:
                user_obj.full_name = full_name
            if dept_id:
                user_obj.department_id = dept_id
            user_obj.role = target_role
            user_obj.is_active = True
            updated_count += 1
        else:
            new_u = User(
                id=str(uuid.uuid4()),
                email=email,
                full_name=full_name or email.split("@")[0],
                role=target_role,
                org_id=current_user.org_id,
                department_id=dept_id,
                is_active=True,
                privacy_accepted=True,
            )
            db.add(new_u)
            created_count += 1

    await db.commit()
    return success(
        data={"created": created_count, "updated": updated_count, "errors": errors},
        message=f"Roster processed: {created_count} added, {updated_count} updated. {len(errors)} errors.",
    )


async def handle_bulk_user_action(body: BulkUserActionRequest, db, current_user):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Admins can perform bulk user actions.")
    if not body.user_ids:
        raise HTTPException(status_code=400, detail="No user IDs provided.")

    query = select(User).where(User.id.in_(body.user_ids))
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]:
        query = query.where(User.org_id == current_user.org_id)

    res = await db.execute(query)
    target_users = res.scalars().all()
    if not target_users:
        raise HTTPException(status_code=404, detail="No eligible users found for bulk operation.")

    affected_count = len(target_users)

    if body.action == "assign_department":
        for u in target_users:
            u.department_id = body.department_id if body.department_id != "unassigned" else None
    elif body.action == "change_role":
        if not body.role:
            raise HTTPException(status_code=400, detail="Role parameter is required.")
        try:
            target_role = UserRole(body.role.lower())
            for u in target_users:
                if u.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]:
                    u.role = target_role
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role specified.")
    elif body.action == "deactivate":
        for u in target_users:
            if u.id != current_user.id:
                u.is_active = False
                u.deactivated_at = datetime.now(timezone.utc)
    elif body.action == "activate":
        for u in target_users:
            u.is_active = True
            u.deactivated_at = None
    elif body.action == "delete":
        for u in target_users:
            if u.id != current_user.id:
                await db.delete(u)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported bulk action '{body.action}'")

    await db.commit()
    return success(
        data={"affected": affected_count, "action": body.action},
        message=f"Bulk action '{body.action}' successfully applied to {affected_count} users.",
    )
