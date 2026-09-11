from fastapi import APIRouter
from app.api.v1.auth.google import router as google_router
from app.api.v1.auth.microsoft import router as microsoft_router
from app.api.v1.auth.otp import router as otp_router
from app.api.v1.auth.session import router as session_router

router = APIRouter(prefix="/auth", tags=["auth"])

router.include_router(google_router)
router.include_router(microsoft_router)
router.include_router(otp_router)
router.include_router(session_router)
