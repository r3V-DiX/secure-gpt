# backend/app/api/v1/users.py

from app.core.dependencies import CurrentUser, DBSession, has_permission
from app.core.pagination import Pagination
from app.core.response import paginated, success
from app.models.user import User, UserRole
from app.schemas.user_schema import UserInviteRequest
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import func, select

router = APIRouter(prefix="/users", tags=["users"])


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "fullName": user.full_name,
        "avatarUrl": user.avatar_url,
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "isActive": user.is_active,
        "orgId": user.org_id,
        "departmentId": user.department_id,
        "createdAt": user.created_at.isoformat(),
        "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
    }


@router.patch("/{user_id}/department", summary="Assign user to a department")
async def assign_user_department(
    user_id: str,
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    body = await request.json()
    department_id = body.get("department_id")

    res = await db.execute(select(User).where(User.id == user_id))
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != UserRole.SUPER_ADMIN and target_user.org_id != current_user.org_id:
        raise HTTPException(status_code=403, detail="Cannot modify users from another organization")

    target_user.department_id = department_id or None
    await db.commit()
    await db.refresh(target_user)

    return success(data=_serialize_user(target_user), message="User department updated successfully")


@router.patch("/{user_id}/role", summary="Change user role")
async def change_user_role(
    user_id: str,
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    body = await request.json()
    new_role_str = body.get("role")
    if not new_role_str:
        raise HTTPException(status_code=400, detail="Role is required")

    res = await db.execute(select(User).where(User.id == user_id))
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]:
        if current_user.role != UserRole.ORG_ADMIN:
            raise HTTPException(status_code=403, detail="Only Organization Admins can change user roles")
        if target_user.org_id != current_user.org_id:
            raise HTTPException(status_code=403, detail="Cannot modify users from another organization")
        if new_role_str.lower() not in ["employee", "org_admin", "user"]:
            raise HTTPException(status_code=403, detail="Invalid role assignment")

    try:
        target_user.role = UserRole(new_role_str.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    await db.commit()
    await db.refresh(target_user)

    return success(data=_serialize_user(target_user), message="User role updated successfully")


from typing import List, Optional
import csv
import io
import uuid
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from sqlalchemy import func, select, or_, delete, update

class BulkUserActionRequest(BaseModel):
    user_ids: List[str]
    action: str  # "assign_department" | "change_role" | "deactivate" | "activate" | "delete"
    department_id: Optional[str] = None
    role: Optional[str] = None


@router.get("", summary="List users with enterprise search and filters")
async def list_users(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
    search: Optional[str] = Query(default=None, description="Search by name or email"),
    department_id: Optional[str] = Query(default=None, description="Filter by department ID"),
    role: Optional[str] = Query(default=None, description="Filter by role"),
    is_active: Optional[bool] = Query(default=None, description="Filter active/deactivated users"),
):
    query = select(User)
    
    # Super admins can see everyone.
    # Org admins & employees can see users in their own org.
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]:
        if current_user.org_id:
            query = query.where(User.org_id == current_user.org_id)
        else:
            query = query.where(User.id == current_user.id)
    
    # Apply filters
    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
            )
        )
    
    if department_id:
        if department_id == "unassigned":
            query = query.where(User.department_id.is_(None))
        else:
            query = query.where(User.department_id == department_id)
            
    if role and role.strip():
        role_clean = role.strip().lower()
        query = query.where(func.lower(func.cast(User.role, func.text())) == role_clean)
        
    if is_active is not None:
        query = query.where(User.is_active == is_active)
        
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.order_by(User.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return paginated(
        data=[_serialize_user(u) for u in users],
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/export-csv", summary="Export users list as CSV")
async def export_users_csv(
    db: DBSession,
    current_user: CurrentUser,
    search: Optional[str] = Query(default=None),
    department_id: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default=None),
):
    from app.models.department import Department
    query = select(User)
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]:
        if current_user.org_id:
            query = query.where(User.org_id == current_user.org_id)
        else:
            query = query.where(User.id == current_user.id)
            
    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
            )
        )
    if department_id:
        if department_id == "unassigned":
            query = query.where(User.department_id.is_(None))
        else:
            query = query.where(User.department_id == department_id)
    if role and role.strip():
        query = query.where(func.lower(func.cast(User.role, func.text())) == role.strip().lower())

    result = await db.execute(query.order_by(User.email.asc()))
    users = result.scalars().all()

    # Load department map
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


@router.post("/import-csv", summary="Bulk import and enroll employees via CSV")
async def import_users_csv(
    file: UploadFile = File(...),
    db: DBSession = None,
    current_user: CurrentUser = None,
):
    from app.models.department import Department
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Organization Admins can import employee rosters.")

    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="Must belong to an organization to import employees.")

    # Read CSV contents
    content = await file.read()
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    # Preload departments for this org
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

        # Resolve role
        target_role = UserRole.EMPLOYEE
        if role_raw in ["org_admin", "admin"]:
            target_role = UserRole.ORG_ADMIN
        elif role_raw == "user":
            target_role = UserRole.USER

        # Check existing user
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
        data={
            "created": created_count,
            "updated": updated_count,
            "errors": errors,
        },
        message=f"Roster processed: {created_count} added, {updated_count} updated. {len(errors)} errors.",
    )


@router.post("/bulk", summary="Perform bulk operations on employees")
async def bulk_user_action(
    body: BulkUserActionRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Admins can perform bulk user actions.")

    if not body.user_ids:
        raise HTTPException(status_code=400, detail="No user IDs provided.")

    # Fetch target users with org boundary check
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
                # Do not allow demoting super admin
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


@router.delete("/{user_id}", summary="Delete or remove user from organization")
async def delete_user(
    user_id: str,
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    from app.models.session import Session
    from app.models.device import Device
    from app.models.policy import Policy
    from sqlalchemy import delete

    res = await db.execute(select(User).where(User.id == user_id))
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Permissions check: Super admin can delete anyone. Org admin can delete users in their org.
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]:
        if current_user.role == UserRole.ORG_ADMIN:
            if target_user.org_id != current_user.org_id:
                raise HTTPException(status_code=403, detail="Cannot delete users from another organization")
            if target_user.id == current_user.id:
                raise HTTPException(status_code=400, detail="Cannot delete yourself from admin panel. Use Profile settings.")
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions to delete users")

    # 1. Terminate all active sessions for this user immediately
    await db.execute(delete(Session).where(Session.user_id == target_user.id))

    # 2. Delete all registered devices
    await db.execute(delete(Device).where(Device.user_id == target_user.id))

    # 3. Delete all custom policies created by this user
    await db.execute(delete(Policy).where(Policy.user_id == target_user.id))

    # 4. Permanently remove the user record
    await db.delete(target_user)
    await db.commit()

    return success(message=f"User {target_user.email} was permanently removed.")
