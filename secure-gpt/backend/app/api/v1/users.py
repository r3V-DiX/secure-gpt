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
        "createdAt": user.created_at.isoformat(),
        "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
    }


@router.get("", summary="List users", dependencies=[has_permission("user:view_all")])
async def list_users(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    pagination: Pagination,
):
    query = select(User)
    
    # Super admins can see everyone.
    # Org admins (like security_admin) can only see users in their org.
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.where(User.org_id == current_user.org_id)
        
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
