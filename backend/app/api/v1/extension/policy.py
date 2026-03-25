# backend/app/api/v1/extension/policy.py
# ─────────────────────────────────────────────────────────────────────────────
# Extension policy sync endpoint.
# The browser extension polls this to get the latest policy config.
# Auth via session cookie.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Request

from app.core.dependencies import DBSession, CurrentUser
from app.core.response import success
from app.core.ratelimit import limiter, LIMIT_EXTENSION_POLICY
from app.services.extension_service import get_policy_for_extension

router = APIRouter(prefix="/extension/policy", tags=["extension"])


@router.get("", summary="Get active policy for extension")
@limiter.limit(LIMIT_EXTENSION_POLICY)
async def get_extension_policy(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Return the user's active policy config for the browser extension.
    Falls back to sensible defaults if no policy has been configured yet.
    Rate limited to 10 requests/minute — extension should poll every 30s max.
    """
    policy_data = await get_policy_for_extension(db, current_user.id)

    return success(
        data=policy_data,
        message="Policy fetched successfully",
    )