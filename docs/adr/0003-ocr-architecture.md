# ADR 0003: Modular Package Extraction for Client-Side OCR (`@securegpt/ocr`)

## Status
Accepted

## Context
Client-side OCR is essential for scanning pasted screenshots and identity cards in the SecureGPT Chrome extension. Previously, OCR logic was tightly coupled within `@securegpt/detection`, preventing isolated benchmarking, image filter experimentation, and alternative engine support.

## Decision
1. Decouple OCR into an independent monorepo workspace package `@securegpt/ocr`.
2. Implement a 3-stage pipeline: Universal Pure-TypedArray Preprocessing (Otsu binarization, dark mode inversion, unsharp mask) $\to$ Pluggable `OcrEngine` (Tesseract / Mock / ONNX) $\to$ Post-OCR Glyph Recovery (Verhoeff / Luhn checksums).
3. Establish a standalone CLI evaluation harness (`evaluate_ocr.ts`) measuring Character Error Rate (CER), Word Error Rate (WER), and PII Recall.

## Consequences
- **Positive**: Zero coupling with text NER models; 100% testable in Node and Browser; mathematical checksums eliminate false negatives on noisy OCR scans.
- **Negative**: Adds a dedicated package to monorepo maintenance.
