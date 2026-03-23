# ─────────────────────────────────────────────
# Redaction Routes
# Endpoints for irreversible PDF redaction
# ─────────────────────────────────────────────

import os
import json
import shutil
import tempfile
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks, status
from fastapi.responses import FileResponse
from app.core.dependencies import get_current_user
from app.services import redaction_service

router = APIRouter(prefix="/redact", tags=["Redaction"])


@router.post("/pdf")
async def redact_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    regions: str = Form(...),  # Expected to be a JSON string from frontend
    current_user=Depends(get_current_user)
):
    """
    STRICT REQUIREMENT: 100% irreversible PDF redaction via image-based pipeline.
    This endpoint rasterizes the PDF to destroy all text layers and metadata, 
    then applies solid black redaction marks.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Only PDF files are supported"
        )

    try:
        parsed_regions = json.loads(regions)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid regions JSON format"
        )

    # Save uploaded file to a temporary location
    temp_dir = tempfile.mkdtemp(prefix="securegpt_redact_")
    input_pdf_path = os.path.join(temp_dir, "input.pdf")
    
    try:
        with open(input_pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Call the redaction service
        # It creates its own temp dir for processing and returns the output path
        output_pdf_path = redaction_service.redact_pdf_file(
            input_pdf_path, 
            parsed_regions, 
            dpi=300
        )
        
        # Schedule cleanup of both the input and output directories
        # output_pdf_path is inside another temp dir created by the service
        output_dir = os.path.dirname(output_pdf_path)
        background_tasks.add_task(redaction_service.cleanup_temp_dir, temp_dir)
        background_tasks.add_task(redaction_service.cleanup_temp_dir, output_dir)
        
        return FileResponse(
            output_pdf_path,
            media_type="application/pdf",
            filename=f"redacted_{file.filename}"
        )

    except Exception as e:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Redaction failed: {str(e)}"
        )
