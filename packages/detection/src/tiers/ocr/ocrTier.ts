// ─────────────────────────────────────────────
// Tier 3 — OCR (Image Text Extraction)
// STUB — AI dev will implement this
// ─────────────────────────────────────────────

import { BaseTier } from '../base-tier'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'

export class OCRTier extends BaseTier {
  readonly name = 'ocr' as const
  readonly enabled = false // disabled until AI dev implements

  async initialize(): Promise<void> {
    // TODO (AI dev):
    // 1. Initialize Tesseract.js WASM engine via ocrWorker.ts
    // 2. Load eng.traineddata language pack
    // 3. Keep engine warm between calls
    console.warn('[OCRTier] Not yet implemented — skipping OCR tier')
  }

  async run(_text: string, _config: PIIConfig): Promise<PIIEntity[]> {
    // TODO (AI dev):
    // NOTE: For OCR, input is not text but an image (base64 or ImageData)
    // The pipeline will need to handle image inputs separately
    // 1. Send image to ocrWorker via chrome offscreen document
    // 2. Receive extracted text back
    // 3. Run RegexTier on extracted text
    // 4. Optionally run NERTier on extracted text
    // 5. Return combined entities with tier = 'ocr'
    return []
  }
}
