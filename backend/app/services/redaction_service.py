# ─────────────────────────────────────────────
# Redaction Service
# Core logic for irreversible PDF redaction
# ─────────────────────────────────────────────

import os
import json
import shutil
import tempfile
import uuid
from typing import List, Dict, Any
from pdf2image import convert_from_path
from PIL import Image, ImageDraw
from fastapi import HTTPException


def redact_pdf_file(
    file_path: str,
    regions: List[Dict[str, Any]],
    dpi: int = 300
) -> str:
    """
    Perform 100% irreversible PDF redaction via rasterization.
    
    Step 1: Convert PDF to high-DPI images (destroys text layer/metadata).
    Step 2: Draw solid black rectangles over sensitive areas.
    Step 3: Rebuild a new PDF from the processed images.
    
    :param file_path: Path to the input PDF file.
    :param regions: List of redaction regions with coordinates (x, y, width, height, page).
    :param dpi: Resolution for rasterization (default 300).
    :return: Path to the redacted output PDF.
    """
    # Create a unique working directory
    job_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp(prefix=f"redact_{job_id}_")
    
    try:
        # Step 1: PDF -> Images
        # This is a critical security step - it destroys all vector/text metadata.
        images = convert_from_path(file_path, dpi=dpi, fmt="png")
        
        if not images:
            raise ValueError("PDF has no pages or failed to render")

        processed_images = []
        # Industry standard DPI for PDF layout is 72.
        # pdf2image uses the requested DPI (e.g. 300).
        scale_factor = dpi / 72.0
        
        # Step 2: Apply redactions to each page
        for i, img in enumerate(images):
            draw = ImageDraw.Draw(img)
            
            # Find regions for this specific page (i) - 0-indexed
            page_regions = [r for r in regions if int(r.get("page", -1)) == i]
            
            for region in page_regions:
                # Coordinate normalization from canvas space (72 DPI) to image space (300 DPI)
                x1 = float(region["x"]) * scale_factor
                y1 = float(region["y"]) * scale_factor
                x2 = (float(region["x"]) + float(region["width"])) * scale_factor
                y2 = (float(region["y"]) + float(region["height"])) * scale_factor
                
                # Draw solid black rectangle (Irreversible)
                draw.rectangle([x1, y1, x2, y2], fill="black", outline="black")
            
            processed_images.append(img)

        # Step 3: Rebuild PDF from images
        output_pdf_path = os.path.join(temp_dir, "redacted.pdf")
        first_img = processed_images[0]
        other_imgs = processed_images[1:]
        
        first_img.save(
            output_pdf_path, 
            "PDF", 
            resolution=float(dpi), 
            save_all=True, 
            append_images=other_imgs
        )
        
        # We return the path. Caller is responsible for cleanup or moving.
        return output_pdf_path

    except Exception as e:
        # Cleanup temp dir on failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise e


def cleanup_temp_dir(temp_dir: str):
    """Safely remove a temporary directory."""
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
