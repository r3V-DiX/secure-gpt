# backend/app/services/redaction_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Redaction Service — core logic for irreversible PDF redaction.
# ─────────────────────────────────────────────────────────────────────────────

import os
import shutil
import tempfile
import uuid
from typing import List, Dict, Any

from pdf2image import convert_from_path
from PIL import Image, ImageDraw


def redact_pdf_file(
    file_path: str,
    regions: List[Dict[str, Any]],
    dpi: int = 300,
) -> str:
    """
    Perform 100% irreversible PDF redaction via rasterization.

    Step 1: Convert PDF to high-DPI images (destroys all text layers + metadata).
    Step 2: Draw solid black rectangles over sensitive regions.
    Step 3: Rebuild a new PDF from the processed images.

    Returns the path to the redacted output PDF.
    Caller is responsible for cleanup (via background task).
    """
    job_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp(prefix=f"redact_{job_id}_")

    try:
        # Step 1 — rasterize (destroys text layer and metadata)
        images = convert_from_path(file_path, dpi=dpi, fmt="png")
        if not images:
            raise ValueError("PDF has no pages or failed to render")

        # Industry standard PDF DPI is 72. pdf2image renders at the requested DPI.
        scale_factor = dpi / 72.0

        # Step 2 — apply redaction rectangles
        processed_images: list[Image.Image] = []
        for i, img in enumerate(images):
            draw = ImageDraw.Draw(img)
            page_regions = [r for r in regions if int(r.get("page", -1)) == i]
            for region in page_regions:
                x1 = float(region["x"]) * scale_factor
                y1 = float(region["y"]) * scale_factor
                x2 = (float(region["x"]) + float(region["width"])) * scale_factor
                y2 = (float(region["y"]) + float(region["height"])) * scale_factor
                draw.rectangle([x1, y1, x2, y2], fill="black", outline="black")
            processed_images.append(img)

        # Step 3 — rebuild PDF from images
        output_pdf_path = os.path.join(temp_dir, "redacted.pdf")
        first_img = processed_images[0]
        other_imgs = processed_images[1:]
        first_img.save(
            output_pdf_path,
            "PDF",
            resolution=float(dpi),
            save_all=True,
            append_images=other_imgs,
        )

        return output_pdf_path

    except Exception:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise


def cleanup_temp_dir(temp_dir: str) -> None:
    """Safely remove a temporary directory."""
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)