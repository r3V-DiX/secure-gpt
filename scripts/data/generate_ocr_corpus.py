#!/usr/bin/env python3
"""
Generate realistic augmented OCR document test instances.
Applies transformations (contrast, blur, rotations, dark-mode inversion) to base document images
and produces an expanded dataset for @securegpt/ocr benchmarking.
"""

import json
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[2]
DOC_IMAGES_DIR = ROOT / "test_documents/images"
OCR_DATASET_DIR = ROOT / "secure-gpt/packages/ocr/dataset"
AUGMENTED_IMAGES_DIR = OCR_DATASET_DIR / "images"
GROUND_TRUTH_FILE = OCR_DATASET_DIR / "ground_truth.jsonl"

BASE_FIXTURES = [
    {
        "base_id": "pan",
        "file": "anshul_pan.png",
        "title": "Income Tax PAN Card",
        "expectedText": "INCOME TAX DEPARTMENT GOVT. OF INDIA Permanent Account Number ABCPE1234F Name: ANSHUL SHARMA",
        "expectedEntities": [{"type": "pan_card", "value": "ABCPE1234F"}],
    },
    {
        "base_id": "aadhaar",
        "file": "anshul_aadhar.png",
        "title": "Aadhaar Identity Card",
        "expectedText": "GOVERNMENT OF INDIA Unique Identification Authority of India 759229028107 Help: 1947",
        "expectedEntities": [{"type": "aadhaar", "value": "759229028107"}],
    },
    {
        "base_id": "passport",
        "file": "indianpp.jpg",
        "title": "Indian Passport Data Page",
        "expectedText": "REPUBLIC OF INDIA PASSPORT PASSPORT NO: K1234567 NATIONALITY: INDIAN",
        "expectedEntities": [{"type": "passport", "value": "K1234567"}],
    },
    {
        "base_id": "invoice",
        "file": "test_financial_doc.png",
        "title": "Financial Invoice Document",
        "expectedText": "SECURECORP LTD INVOICE #9821 GSTIN: 27ABCDE1234F1Z5 Contact: billing@securecorp.com Personal PAN: ABCPE1234F",
        "expectedEntities": [
            {"type": "gstin", "value": "27ABCDE1234F1Z5"},
            {"type": "email", "value": "billing@securecorp.com"},
            {"type": "pan_card", "value": "ABCPE1234F"},
        ],
    },
    {
        "base_id": "medical",
        "file": "test_medical_doc.png",
        "title": "Hospital Medical Report",
        "expectedText": "HOSPITAL DISCHARGE SUMMARY PATIENT HEALTH ID: 12-3456-7890-1234 DIAGNOSIS: CONFIDENTIAL",
        "expectedEntities": [{"type": "abha_id", "value": "12-3456-7890-1234"}],
    },
    {
        "base_id": "technical",
        "file": "test_technical_doc.png",
        "title": "Technical Server Architecture Config",
        "expectedText": "INTERNAL SYSTEM CONFIGURATION AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY IP: 192.168.1.50",
        "expectedEntities": [
            {"type": "aws_secret_key", "value": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"},
            {"type": "ipv4", "value": "192.168.1.50"},
        ],
    },
]

AUGMENTATION_CONFIGS = [
    ("original", "Clean Original Scan", lambda img: img),
    ("dark_mode", "Dark Mode / Inverted", lambda img: ImageOps.invert(img.convert("RGB"))),
    ("contrast_low", "Low Contrast Faded Scan", lambda img: ImageEnhance.Contrast(img).enhance(0.55)),
    ("contrast_high", "High Contrast Photocopy", lambda img: ImageEnhance.Contrast(img).enhance(1.85)),
    ("blur_light", "Light Camera Blur", lambda img: img.filter(ImageFilter.GaussianBlur(radius=0.75))),
    ("rot_90", "90-degree Rotated", lambda img: img.rotate(90, expand=True)),
    ("rot_180", "180-degree Upside Down", lambda img: img.rotate(180, expand=True)),
    ("rot_270", "270-degree Rotated", lambda img: img.rotate(270, expand=True)),
]


def main():
    AUGMENTED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    out_items = []

    for fixture in BASE_FIXTURES:
        src_path = DOC_IMAGES_DIR / fixture["file"]
        if not src_path.exists():
            print(f"Skipping {fixture['file']} (not found in {DOC_IMAGES_DIR})")
            continue

        base_img = Image.open(src_path)

        for aug_key, aug_desc, aug_fn in AUGMENTATION_CONFIGS:
            out_filename = f"{fixture['base_id']}_{aug_key}.png"
            out_path = AUGMENTED_IMAGES_DIR / out_filename

            transformed = aug_fn(base_img.copy())
            if transformed.mode in ("RGBA", "P"):
                transformed = transformed.convert("RGB")
            transformed.save(out_path, format="PNG")

            item_id = f"ocr-{fixture['base_id']}-{aug_key}"
            out_items.append({
                "id": item_id,
                "title": f"{fixture['title']} ({aug_desc})",
                "imagePath": str(out_path.resolve()),
                "expectedText": fixture["expectedText"],
                "expectedEntities": fixture["expectedEntities"],
            })

    # Write out expanded ground truth file
    with open(GROUND_TRUTH_FILE, "w", encoding="utf-8") as f:
        for item in out_items:
            f.write(json.dumps(item) + "\n")

    print(f"Successfully generated {len(out_items)} augmented OCR document test instances.")
    print(f"Ground truth written to: {GROUND_TRUTH_FILE}")


if __name__ == "__main__":
    main()
