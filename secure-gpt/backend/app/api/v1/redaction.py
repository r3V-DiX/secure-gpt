# backend/app/api/v1/redaction.py
# ─────────────────────────────────────────────────────────────────────────────
# Redaction Routes — irreversible PDF redaction via image pipeline.
# ─────────────────────────────────────────────────────────────────────────────

import json
import os
import shutil
import tempfile

from app.core.dependencies import CurrentUser
from app.core.exceptions import AppException, ValidationError
from app.core.ratelimit import LIMIT_REDACT, limiter
from app.services import redaction_service
from fastapi import APIRouter, BackgroundTasks, File, Form, Request, UploadFile
from fastapi.responses import FileResponse

router = APIRouter(prefix="/redact", tags=["redaction"])


@router.post("/pdf", summary="Irreversible PDF redaction")
@limiter.limit(LIMIT_REDACT)
async def redact_pdf(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    file: UploadFile = File(...),  # noqa: B008
    regions: str = Form(...),
):
    """
    100% irreversible PDF redaction via image-based pipeline.
    Rasterizes the PDF (destroying all text layers and metadata),
    then applies solid black redaction marks over specified regions.
    """
    if file.content_type != "application/pdf":
        raise ValidationError("Only PDF files are supported")

    try:
        parsed_regions = json.loads(regions)
    except Exception:  # noqa: BLE001
        raise ValidationError("Invalid regions JSON format")

    temp_dir = tempfile.mkdtemp(prefix="sgpt_redact_")
    input_pdf_path = os.path.join(temp_dir, "input.pdf")

    try:
        with open(input_pdf_path, "wb") as buffer:  # noqa: ASYNC230
            content = await file.read()
            buffer.write(content)

        output_pdf_path = redaction_service.redact_pdf_file(
            input_pdf_path,
            parsed_regions,
            dpi=300,
        )

        output_dir = os.path.dirname(output_pdf_path)
        background_tasks.add_task(redaction_service.cleanup_temp_dir, temp_dir)
        background_tasks.add_task(redaction_service.cleanup_temp_dir, output_dir)

        return FileResponse(
            output_pdf_path,
            media_type="application/pdf",
            filename=f"redacted_{file.filename}",
        )

    except (ValidationError, AppException):
        raise
    except Exception as e:  # noqa: BLE001
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise AppException(f"Redaction failed: {e!s}")