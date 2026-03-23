// ─────────────────────────────────────────────
// Tier 3 — OCR (Image Text Extraction)
// Extracts text from images and runs detection
// ─────────────────────────────────────────────

import { BaseTier } from '../base-tier'
import { getOcrWorker } from './ocrWorker'
import { classifyDocument } from './ocrUtils'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import { normalizeText } from '@securegpt/shared/utils/detection-helpers'

export class OCRTier extends BaseTier {
  readonly name = 'ocr' as const
  readonly enabled = true

  override async initialize(): Promise<void> {
    await getOcrWorker()
  }

  /**
   * For OCR, the pipeline handles the image input.
   * This method runs when text extracted from an image needs additional processing.
   */
  async run(text: string, _config: PIIConfig): Promise<PIIEntity[]> {
    if (!text || text.trim().length === 0) return []
    
    // The OCR detection is usually triggered by detectPIIFromImage which runs
    // its own logic. This run() method can be used if OCR is treated as a 
    // text-processing tier on extracted text.
    return []
  }

  /**
   * Specialized method for image-based detection.
   * Called by the pipeline when an image is processed.
   */
  async runOnImage(imageUrl: string, _config: PIIConfig): Promise<{
    rawText: string
    entities: PIIEntity[]
  }> {
    const worker = await getOcrWorker()
    if (!worker) return { rawText: '', entities: [] }

    try {
      console.info('[OCRTier] Processing image...')
      const { data } = await worker.recognize(imageUrl)
      const rawText = normalizeText(data.text)
      
      if (!rawText) return { rawText: '', entities: [] }

      // Document classification
      classifyDocument(rawText)

      // In the pipeline, we run RegexTier and NERTier on the extracted rawText.
      // This is handled by detectPIIFromImage in pipeline.ts.
      
      return { rawText, entities: [] } // Entities will be filled by pipeline

    } catch (err) {
      console.error('[OCRTier] OCR failed:', (err as Error).message)
      return { rawText: '', entities: [] }
    }
  }
}
