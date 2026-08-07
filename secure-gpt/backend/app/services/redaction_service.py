# backend/app/services/redaction_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Redaction Service — core logic for irreversible PDF redaction.
# ─────────────────────────────────────────────────────────────────────────────

import io
import os
import re
import shutil
import tempfile
import uuid
import zipfile
import xml.etree.ElementTree as ET
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


# ─────────────────────────────────────────────────────────────────────────────
# Office document masking — replace PII text nodes inside OOXML/ODF/EPUB zips.
# ─────────────────────────────────────────────────────────────────────────────

# Text-bearing parts per zip-based format. Any docx/xlsx/pptx/odt/ods/odp part
# matching one of these regexes gets its text elements scanned for PII values.
OFFICE_PART_PATTERNS: Dict[str, List[str]] = {
    "docx": [r"^word/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$"],
    "docm": [r"^word/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$"],
    "xlsx": [r"^xl/(sharedStrings|worksheets/sheet\d+|comments\d*)\.xml$"],
    "xlsm": [r"^xl/(sharedStrings|worksheets/sheet\d+|comments\d*)\.xml$"],
    "pptx": [r"^ppt/(slides/slide\d+|notesSlides/notesSlide\d+)\.xml$"],
    "pptm": [r"^ppt/(slides/slide\d+|notesSlides/notesSlide\d+)\.xml$"],
    "ppsx": [r"^ppt/(slides/slide\d+|notesSlides/notesSlide\d+)\.xml$"],
    "ppsm": [r"^ppt/(slides/slide\d+|notesSlides/notesSlide\d+)\.xml$"],
    "odt": [r"^content\.xml$", r"^meta\.xml$"],
    "ods": [r"^content\.xml$", r"^meta\.xml$"],
    "odp": [r"^content\.xml$", r"^meta\.xml$"],
    "epub": [r"\.(xhtml|html)$"],
}

# Text lives in elements whose local tag is "t" for OOXML (w:t / a:t / t);
# ODF + EPUB carry prose in many element types, so any element's .text is scanned.
OOXML_FORMATS = {"docx", "docm", "xlsx", "xlsm", "pptx", "pptm", "ppsx", "ppsm"}
# OOXML formats where a value may be split across adjacent runs in one paragraph
# (docx w:p runs, pptx a:p runs) — merge pass rewrites the paragraph.
MERGE_RUNS_FORMATS = {"docx", "docm", "pptx", "pptm", "ppsx", "ppsm"}


def _local(tag: str) -> str:
    """Return the local part of a Clark-notation XML tag (`{ns}tag` → `tag`)."""
    return tag.rsplit("}", 1)[-1]


def _mask_xml_part(raw: bytes, entities: List[Dict[str, Any]], fmt: str) -> bytes:
    """Rewrite PII values inside one XML part of an office zip.

    Mutates ``entities`` in place, setting ``matched`` on every value that was
    found and replaced. Elements are matched by local tag, so the namespace is
    irrelevant. Returns the re-serialized XML (namespaces preserved via
    ``register_namespace`` from the part's own declarations).
    """
    src = io.BytesIO(raw)
    parser = ET.XMLParser()
    prefixes: Dict[str, str] = {}
    root = None
    for event, data in ET.iterparse(src, events=("start-ns", "end"), parser=parser):
        if event == "start-ns":
            prefix, uri = data
            prefixes[prefix] = uri
        else:
            root = data
    if root is None:
        raise ValueError("Empty XML part")

    for prefix, uri in prefixes.items():
        ET.register_namespace(prefix, uri)

    # Pass 1 — every text element that contains the whole value is masked
    # (a PII value may legitimately appear more than once in a document).
    # OOXML keeps prose in "t" elements; ODF/EPUB scatter text across many
    # element types, so scan any element's .text there.
    scan_all_elements = fmt not in OOXML_FORMATS
    for entity in entities:
        if entity.get("matched") or not entity.get("value"):
            continue
        value, masked = entity["value"], entity["maskedValue"]
        for el in root.iter():
            if not el.text or value not in el.text:
                continue
            if not scan_all_elements and _local(el.tag) != "t":
                continue
            el.text = el.text.replace(value, masked)
            entity["matched"] = True

    # Pass 2 — value split across adjacent runs in one paragraph (docx/pptx).
    # Join the paragraph's descendant text elements, search, then write the
    # full result into the first element and empty the rest. Collapses the
    # paragraph's run formatting, but guarantees the value is masked.
    if fmt in MERGE_RUNS_FORMATS:
        for entity in entities:
            if entity.get("matched") or not entity.get("value"):
                continue
            value, masked = entity["value"], entity["maskedValue"]
            for para in root.iter():
                if _local(para.tag) != "p":
                    continue
                text_elems = [e for e in para.iter() if _local(e.tag) == "t"]
                joined = "".join(e.text or "" for e in text_elems)
                if joined and value in joined:
                    joined = joined.replace(value, masked)
                    text_elems[0].text = joined
                    for extra in text_elems[1:]:
                        extra.text = ""
                    entity["matched"] = True

    return ET.tostring(root, encoding="UTF-8", xml_declaration=True)


def _raise_if_missed(entities: List[Dict[str, Any]]) -> None:
    """Fail closed: never return a file with an unlocated PII value."""
    missed = [e["value"] for e in entities if not e.get("matched")]
    if missed:
        raise ValueError(f"Office masking could not locate values: {', '.join(missed[:5])}")


def redact_office_file(
    file_path: str,
    entities: List[Dict[str, Any]],
    ext: str,
) -> str:
    """Mask PII values inside an office document. Returns the masked file path.

    ``entities`` is a list of ``{"value", "maskedValue"}`` dicts (maskedValue is
    precomputed client-side, e.g. ``[PAN-REDACTED]``). The file is reopened as a
    zip, text-bearing XML parts are rewritten, and untouched parts are copied
    byte-for-byte. Raises ValueError if any value could not be located
    (fail-closed). Caller is responsible for cleanup via ``cleanup_temp_dir``.
    """
    ext = (ext or "").lower().lstrip(".")
    job_id = str(uuid.uuid4())
    entities = [dict(e, matched=False) for e in entities]

    # Plain-text formats — whole-file replacement, no zip.
    if ext in ("csv", "rtf"):
        with open(file_path, "rb") as f:
            raw = f.read()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text = raw.decode("latin-1")
        for entity in entities:
            value, masked = entity.get("value"), entity.get("maskedValue")
            if value and value in text:
                text = text.replace(value, masked)
                entity["matched"] = True
        _raise_if_missed(entities)
        out_dir = tempfile.mkdtemp(prefix=f"office_mask_{job_id}_")
        out_path = os.path.join(out_dir, f"masked.{ext}")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        return out_path

    patterns = OFFICE_PART_PATTERNS.get(ext)
    if not patterns:
        raise ValueError(f"Unsupported office format: {ext}")

    out_dir = tempfile.mkdtemp(prefix=f"office_mask_{job_id}_")
    out_path = os.path.join(out_dir, f"masked.{ext}")

    with zipfile.ZipFile(file_path, "r") as in_zip, zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as out_zip:
        for info in in_zip.infolist():
            raw = in_zip.read(info.filename)
            if any(re.search(p, info.filename) for p in patterns):
                try:
                    raw = _mask_xml_part(raw, entities, ext)
                except Exception:  # noqa: BLE001 — leave a broken part untouched
                    pass
            out_zip.writestr(info, raw)

    _raise_if_missed(entities)
    return out_path