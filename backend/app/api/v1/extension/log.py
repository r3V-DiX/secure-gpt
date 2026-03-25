# backend/app/api/v1/extension/log.py

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.core.dependencies import DBSession, CurrentUser
from app.core.exceptions import BatchTooLarge, InvalidLogBatch
from app.core.response import success
from app.core.ratelimit import limiter, LIMIT_EXTENSION_LOG
from app.services.extension_service import ingest_log_batch

router = APIRouter(prefix="/extension/log", tags=["extension"])

MAX_BATCH_SIZE = 100


class LogBatchRequest(BaseModel):
    events: list[dict] = Field(..., description="Array of detection events from the extension")


@router.post("", summary="Ingest a batch of detection events from the extension")
@limiter.limit(LIMIT_EXTENSION_LOG)
async def ingest_logs(
    request: Request,
    body: LogBatchRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    if not body.events:
        raise InvalidLogBatch("Batch must contain at least one event")

    if len(body.events) > MAX_BATCH_SIZE:
        raise BatchTooLarge(f"Batch contains {len(body.events)} events, maximum is {MAX_BATCH_SIZE}")

    inserted = await ingest_log_batch(db, current_user.id, body.events)
    await db.commit()  # explicit commit — get_db no longer auto-commits

    return success(
        data={
            "received": len(body.events),
            "inserted": inserted,
            "duplicates": len(body.events) - inserted,
        },
        message=f"Batch processed: {inserted} new events stored",
    )