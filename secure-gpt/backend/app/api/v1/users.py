# backend/app/api/v1/users.py

from typing import Optional
from app.core.dependencies import CurrentUser, DBSession
from app.core.pagination import Pagination
from app.core.response import paginated, success
from app.models.user import User, UserRole
from app.models.session import Session
from app.models.device import Device
from app.models.policy import Policy
from app.api.v1.user_operations import (
    BulkUserActionRequest,
    handle_export_users_csv,
    handle_import_users_csv,
    handle_bulk_user_action,
)
from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File
from sqlalchemy import func, select, or_, delete

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
    return await handle_export_users_csv(db, current_user, search, department_id, role)


@router.post("/import-csv", summary="Bulk import and enroll employees via CSV")
async def import_users_csv(
    file: UploadFile = File(...),
    db: DBSession = None,
    current_user: CurrentUser = None,
):
    return await handle_import_users_csv(file, db, current_user)


@router.post("/bulk", summary="Perform bulk operations on employees")
async def bulk_user_action(
    body: BulkUserActionRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    return await handle_bulk_user_action(body, db, current_user)


@router.delete("/{user_id}", summary="Delete or remove user from organization")
async def delete_user(
    user_id: str,
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    res = await db.execute(select(User).where(User.id == user_id))
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_SUPER_ADMIN]:
        if current_user.role == UserRole.ORG_ADMIN:
            if target_user.org_id != current_user.org_id:
                raise HTTPException(status_code=403, detail="Cannot delete users from another organization")
            if target_user.id == current_user.id:
                raise HTTPException(status_code=400, detail="Cannot delete yourself from admin panel. Use Profile settings.")
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions to delete users")

    await db.execute(delete(Session).where(Session.user_id == target_user.id))
    await db.execute(delete(Device).where(Device.user_id == target_user.id))
    await db.execute(delete(Policy).where(Policy.user_id == target_user.id))
    await db.delete(target_user)
    await db.commit()

    return success(message=f"User {target_user.email} was permanently removed.")
