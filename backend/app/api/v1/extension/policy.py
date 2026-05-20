# backend/app/api/v1/extension/policy.py
# ─────────────────────────────────────────────────────────────────────────────
# Extension policy endpoints.
#   GET  /extension/policy         — one-shot fetch (used as fallback poll)
#   GET  /extension/policy/stream  — SSE stream; pushes updates on policy save
# Auth via session cookie.
# ─────────────────────────────────────────────────────────────────────────────

import asyncio
import json

from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

from app.core.dependencies import DBSession, CurrentUser
from app.core.response import success
from app.core.ratelimit import limiter, LIMIT_EXTENSION_POLICY
from app.services.extension_service import (
    get_policy_for_extension,
    subscribe_policy,
    unsubscribe_policy,
)

router = APIRouter(prefix="/extension/policy", tags=["extension"])


@router.get("", summary="Get active policy for extension")
@limiter.limit(LIMIT_EXTENSION_POLICY)
async def get_extension_policy(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    policy_data = await get_policy_for_extension(db, current_user.id)
    return success(data=policy_data, message="Policy fetched successfully")


@router.get("/stream", summary="SSE stream — pushes policy updates in real time")
async def stream_extension_policy(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Long-lived SSE connection. The extension connects once on startup and
    receives a 'policy' event immediately (current policy) then again whenever
    the user saves changes in the dashboard.

    The extension should fall back to polling GET /extension/policy if this
    connection drops and cannot reconnect within a few seconds.
    """
    user_id = current_user.id
    policy_data = await get_policy_for_extension(db, current_user.id)
    q = subscribe_policy(user_id)

    async def event_generator():
        try:
            # Send current policy immediately so extension is never stale on connect
            yield f"event: policy\ndata: {json.dumps(policy_data)}\n\n"

            while True:
                # Check client disconnect every second
                if await request.is_disconnected():
                    break
                try:
                    update = await asyncio.wait_for(q.get(), timeout=1.0)
                    if update is None:
                        break
                    yield f"event: policy\ndata: {json.dumps(update)}\n\n"
                except asyncio.TimeoutError:
                    # Send a keepalive comment so the connection stays alive
                    yield ": keepalive\n\n"
        finally:
            unsubscribe_policy(user_id, q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering
        },
    )