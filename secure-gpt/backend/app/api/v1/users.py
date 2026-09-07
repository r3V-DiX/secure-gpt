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


@router.get("", summary="List users")
async def list_users(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
):
    query = select(User)
    
    # Super admins can see everyone.
    # Org admins & employees can see users in their own org.
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.org_id:
            query = query.where(User.org_id == current_user.org_id)
        else:
            query = query.where(User.id == current_user.id)
        
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


@router.post("/invite", summary="Invite or add user to org", dependencies=[has_permission("user:create")])
async def invite_user(
    request: Request,
    body: UserInviteRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    # Only super_admin or users with an org_id can invite
    if current_user.role != UserRole.SUPER_ADMIN and not current_user.org_id:
        raise HTTPException(status_code=400, detail="You must belong to an organization to invite users.")

    target_org_id = current_user.org_id
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.org_id:
            if existing_user.org_id != target_org_id and current_user.role != UserRole.SUPER_ADMIN:
                raise HTTPException(status_code=400, detail="User already belongs to another organization.")
            # If they are already in the same org, just return success
        else:
            # Add to org
            existing_user.org_id = target_org_id
            await db.commit()
        return success(data=_serialize_user(existing_user), message="User added to organization.")
    else:
        # Create a placeholder user
        new_user = User(
            email=body.email.lower().strip(),
            org_id=target_org_id,
            role=UserRole.USER,
            is_active=True
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        # In a real app, send invite email here.
        return success(data=_serialize_user(new_user), message="User invited and added to organization.")


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
