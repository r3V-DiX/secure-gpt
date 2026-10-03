// ─────────────────────────────────────────────
// Tier 3 — OCR (Image Text Extraction)
// Modular client wrapping @securegpt/ocr pipeline
// ─────────────────────────────────────────────

import { BaseTier } from '@securegpt/shared/tier'
import { OcrPipeline, mapEntitiesToBboxes, upgradeSeverity } from '@securegpt/ocr'
import type { PIIEntity, PIIConfig, Severity } from '@securegpt/shared/types'
import { RegexTier } from '@securegpt/regex'

export class OCRTier extends BaseTier {
  readonly name = 'ocr' as const
  readonly enabled = true
  private pipeline: OcrPipeline

  constructor(pipeline?: OcrPipeline) {
    super()
    this.pipeline = pipeline || new OcrPipeline()
  }

  override async initialize(): Promise<void> {
    await this.pipeline.initialize()
  }

  async run(_text: string, _config: PIIConfig): Promise<PIIEntity[]> {
    return []
  }

  /**
   * Run OCR on image with advanced preprocessing, multi-pass segmentation, and error recovery.
   */
  async runOnImage(imageUrl: string, config: PIIConfig, signal?: AbortSignal): Promise<{
    rawText: string
    ocrData: any
    isConfidential: boolean
    severityFloor: Severity
    rotatedImageUrl?: string
    scale: number
    rotation: number
    imgWidth: number
    imgHeight: number
    confidence: number
  }> {
    try {
      const result = await this.pipeline.processImage(imageUrl, { signal })

      // Check if downstream regex confirms PII findings in the extracted / repaired text
      const regexTier = new RegexTier()
      const findings = await regexTier.run(result.repairedText, config)
      const isConfidential = result.isConfidential || findings.length > 0

      return {
        rawText: result.repairedText || result.rawText,
        ocrData: result.ocrData,
        isConfidential,
        severityFloor: result.severityFloor,
        ...(result.processedUrl ? { rotatedImageUrl: result.processedUrl } : {}),
        scale: result.scale,
        rotation: result.rotation,
        imgWidth: result.imgWidth,
        imgHeight: result.imgHeight,
        confidence: result.confidence,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Unknown OCR error')
      console.error('[OCRTier] OCR processing failed:', msg)
      throw new Error('OCR_PROCESSING_FAILED')
    }
  }

  mapEntitiesToBboxes(
    entities: PIIEntity[],
    ocrData: any,
    rawText: string,
    severityFloor: Severity = 'medium',
    scale: number = 1,
    rotation: number = 0,
    imgWidth: number = 0,
    imgHeight: number = 0
  ): PIIEntity[] {
    return mapEntitiesToBboxes(entities, ocrData, rawText, severityFloor, scale, rotation, imgWidth, imgHeight)
  }
}

export { mapEntitiesToBboxes, upgradeSeverity }
