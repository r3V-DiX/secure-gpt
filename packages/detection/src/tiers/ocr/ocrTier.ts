// ─────────────────────────────────────────────
// Tier 3 — OCR (Image Text Extraction)
// Extracts text from images and runs detection
// ─────────────────────────────────────────────

import { BaseTier } from '../base-tier'
import { getOcrWorker } from './ocrWorker'
import { classifyDocument, upgradeSeverity } from './ocrUtils'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import { normalizeText } from '@securegpt/shared/utils/detection-helpers'

export class OCRTier extends BaseTier {
  readonly name = 'ocr' as const
  readonly enabled = true

  override async initialize(): Promise<void> {
    await getOcrWorker()
  }

  async run(_text: string, _config: PIIConfig): Promise<PIIEntity[]> {
    return []
  }

  /**
   * Run OCR on image with optional sparse pass for PAN cards.
   */
  async runOnImage(imageUrl: string, _config: PIIConfig): Promise<{
    rawText: string
    ocrData: any
    isConfidential: boolean
    severityFloor: any
  }> {
    const worker = await getOcrWorker()
    if (!worker) return { rawText: '', ocrData: null, isConfidential: false, severityFloor: 'medium' }

    try {
      console.info('[OCRTier] Processing image (First Pass)...')
      const { data } = await worker.recognize(imageUrl)
      let rawText = normalizeText(data.text)
      
      const { isConfidential, severityFloor } = classifyDocument(rawText)

      // --- SECOND PASS OPTIMIZATION FOR PAN CARDS ---
      // If no PAN card pattern is found in rawText, try PSM 11 (sparse text)
      if (!/\b([A-Z]{3}[PCHFATLJGE][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi.test(rawText)) {
        console.info('[OCRTier] No PAN found. Running Sparse Pass (PSM 11)...')
        await worker.setParameters({ tessedit_pageseg_mode: '11' as any })
        const { data: sparseData } = await worker.recognize(imageUrl)
        
        // Merge sparse text into rawText if it contains PAN-like patterns
        if (/\b([A-Z]{3}[PCHFATLJGE][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi.test(sparseData.text)) {
          console.info('[OCRTier] Found PAN in Sparse Pass.')
          rawText += '\n' + normalizeText(sparseData.text)
          // Merge word data for bbox mapping
          if ((data as any).words && (sparseData as any).words) {
            (data as any).words.push(...(sparseData as any).words)
          }
        }
        // Reset to AUTO
        await worker.setParameters({ tessedit_pageseg_mode: '3' as any })
      }

      return { rawText, ocrData: data, isConfidential, severityFloor }

    } catch (err) {
      console.error('[OCRTier] OCR failed:', (err as Error).message)
      return { rawText: '', ocrData: null, isConfidential: false, severityFloor: 'medium' }
    }
  }

  /**
   * Maps text-based entities back to image bounding boxes.
   */
  mapEntitiesToBboxes(entities: PIIEntity[], ocrData: any, rawText: string, severityFloor: any): PIIEntity[] {
    if (!ocrData || !ocrData.words) return entities

    const words = ocrData.words as any[]
    
    // Build character index to bbox mapping
    const charBboxes: any[] = []
    let cursor = 0
    
    for (const word of words) {
      const wordText = normalizeText(word.text)
      if (!wordText) continue
      
      const startIndex = rawText.indexOf(wordText, cursor)
      if (startIndex !== -1) {
        for (let i = 0; i < wordText.length; i++) {
          charBboxes[startIndex + i] = word.bbox
        }
        cursor = startIndex + wordText.length
      }
    }

    return entities.map(entity => {
      const bboxes: any[] = []
      const seen = new Set<string>()

      // 1. Try position-based mapping
      for (let i = entity.startIndex; i < entity.endIndex; i++) {
        const box = charBboxes[i]
        if (box) {
          const key = `${box.x0},${box.y0},${box.x1},${box.y1}`
          if (!seen.has(key)) {
            seen.add(key)
            bboxes.push(box)
          }
        }
      }

      // 2. Fallback: Value-based search in words
      if (bboxes.length === 0 && entity.value) {
        const needle = normalizeText(entity.value).replace(/[\s-]+/g, '').toLowerCase()
        for (const word of words) {
          const haystack = normalizeText(word.text).replace(/[\s-]+/g, '').toLowerCase()
          if (haystack && (haystack.includes(needle) || needle.includes(haystack))) {
            const key = `${word.bbox.x0},${word.bbox.y0},${word.bbox.x1},${word.bbox.y1}`
            if (!seen.has(key)) {
              seen.add(key)
              bboxes.push(word.bbox)
            }
          }
        }
      }

      return {
        ...entity,
        tier: 'ocr' as const,
        severity: upgradeSeverity(entity.severity, severityFloor),
        ...(bboxes.length > 0 ? { bboxes } : {})
      }
    })
  }
}
