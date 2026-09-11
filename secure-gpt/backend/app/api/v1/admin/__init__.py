# backend/app/api/v1/admin/__init__.py
from fastapi import APIRouter
from app.api.v1.admin.users import router as users_router
from app.api.v1.admin.roles import router as roles_router
from app.api.v1.admin.permissions import router as permissions_router
from app.api.v1.admin.audit import router as audit_router

router = APIRouter(prefix="/admin")

router.include_router(users_router)
router.include_router(roles_router)
router.include_router(permissions_router)
router.include_router(audit_router)
