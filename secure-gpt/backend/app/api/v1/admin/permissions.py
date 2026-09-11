# backend/app/api/v1/admin/permissions.py
import logging
from fastapi import APIRouter
from sqlalchemy import select

from app.core.dependencies import DBSession, has_permission
from app.core.response import success
from app.models.rbac import Permission
from app.schemas.rbac_schema import PermissionResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["admin-permissions"])


@router.get(
    "/permissions",
    response_model=dict,
    summary="List all granular action permissions",
    dependencies=[has_permission("role:view")]
)
async def list_permissions(db: DBSession):
    stmt = select(Permission).order_by(Permission.module, Permission.action)
    res = await db.execute(stmt)
    permissions = res.scalars().all()
    data = [PermissionResponse.model_validate(p) for p in permissions]
    return success(data=data, message="Permissions list fetched successfully")
