# backend/app/services/redaction_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Redaction Service — core logic for irreversible PDF redaction.
# ─────────────────────────────────────────────────────────────────────────────

import os
import shutil
import tempfile
import uuid
from typing import List, Dict, Any

from pdf2image import convert_from_path, pdfinfo_from_path
from PIL import Image, ImageDraw


def redact_pdf_file(
    file_path: str,
    regions: List[Dict[str, Any]],
    dpi: int = 300,
) -> str:
    """
    Perform 100% irreversible PDF redaction via rasterization.

    Step 1: Convert PDF to images page-by-page, saving to disk to save memory.
    Step 2: Draw solid black rectangles over sensitive regions.
    Step 3: Rebuild a new PDF from the processed images.

    Returns the path to the redacted output PDF.
    Caller is responsible for cleanup (via background task).
    """
    job_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp(prefix=f"redact_{job_id}_")

    try:
        # Step 1 — Get total page count dynamically
        try:
            info = pdfinfo_from_path(file_path)
            total_pages = int(info.get("Pages", 1))
        except Exception:
            total_pages = 1

        # Dynamic DPI adjustment based on page count to control memory footprint
        if total_pages > 20:
            dpi = 100
        elif total_pages > 5:
            dpi = 150

        # Industry standard PDF DPI is 72. pdf2image renders at the requested DPI.
        scale_factor = dpi / 72.0

        # Process each page one-by-one to keep memory flat O(1)
        temp_img_paths: List[str] = []
        for i in range(total_pages):
            # Render exactly one page
            pages = convert_from_path(
                file_path,
                dpi=dpi,
                fmt="png",
                first_page=i + 1,
                last_page=i + 1,
            )
            if not pages:
                raise ValueError(f"Failed to render PDF page {i + 1}")
            
            img = pages[0]
            draw = ImageDraw.Draw(img)
            
            # Apply redactions for this specific page
            page_regions = [r for r in regions if int(r.get("page", -1)) == i]
            for region in page_regions:
                x1 = float(region["x"]) * scale_factor
                y1 = float(region["y"]) * scale_factor
                x2 = (float(region["x"]) + float(region["width"])) * scale_factor
                y2 = (float(region["y"]) + float(region["height"])) * scale_factor
                draw.rectangle([x1, y1, x2, y2], fill="black", outline="black")
            
            # Save the processed image directly to disk
            page_img_path = os.path.join(temp_dir, f"page_{i}.png")
            img.save(page_img_path, "PNG")
            img.close()
            temp_img_paths.append(page_img_path)

        if not temp_img_paths:
            raise ValueError("PDF had no pages or failed to process")

        # Step 3 — rebuild PDF from disk-backed images
        output_pdf_path = os.path.join(temp_dir, "redacted.pdf")
        
        # Load images sequentially to save RAM during compilation
        opened_images = [Image.open(p) for p in temp_img_paths]
        first_img = opened_images[0]
        other_imgs = opened_images[1:]
        
        first_img.save(
            output_pdf_path,
            "PDF",
            resolution=float(dpi),
            save_all=True,
            append_images=other_imgs,
        )
        
        # Close all opened file handles
        for img_obj in opened_images:
            img_obj.close()

        return output_pdf_path

    except Exception:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise


def cleanup_temp_dir(temp_dir: str) -> None:
    """Safely remove a temporary directory."""
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)