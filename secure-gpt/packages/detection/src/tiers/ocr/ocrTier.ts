// ─────────────────────────────────────────────
// Tier 3 — OCR (Image Text Extraction)
// Extracts text from images and runs detection
// ─────────────────────────────────────────────

import { BaseTier } from '../base-tier'
import { getOcrWorker } from './ocrWorker'
import { classifyDocument } from './ocrUtils'
import { loadImage, rotateImageCanvas, preprocessImageCanvas } from './imagePreprocessing'
import { mapEntitiesToBboxes } from './bboxMapper'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import { normalizeText } from '@securegpt/shared/utils/detection-helpers'
import { RegexTier } from '../regex/regexTier'

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof Image !== 'undefined'

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
   * Run OCR on image with optional sparse pass for PAN cards. Supports auto-rotation.
   */
  async runOnImage(imageUrl: string, config: PIIConfig): Promise<{
    rawText: string
    ocrData: any
    isConfidential: boolean
    severityFloor: any
    rotatedImageUrl?: string
    scale: number
    rotation: number
    imgWidth: number
    imgHeight: number
  }> {
    const worker = await getOcrWorker()
    if (!worker) return { rawText: '', ocrData: null, isConfidential: false, severityFloor: 'medium', scale: 1, rotation: 0, imgWidth: 0, imgHeight: 0 }

    try {
      let processedUrl = imageUrl
      let activeImageElement: HTMLImageElement | null = null
      let currentScale = 1
      let currentRotation = 0
      let imgWidth = 0
      let imgHeight = 0

      if (isBrowser) {
        try {
          console.info('[OCRTier] Loading and preprocessing image (grayscale, thresholding, scaling)...')
          const img = await loadImage(imageUrl)
          imgWidth = img.width
          imgHeight = img.height
          const result = preprocessImageCanvas(img)
          processedUrl = result.url
          currentScale = result.scale
          activeImageElement = await loadImage(processedUrl)
        } catch (prepErr) {
          console.warn('[OCRTier] Preprocessing failed, falling back to raw image:', prepErr)
        }
      }

      console.info('[OCRTier] Processing image (First Pass)...')
      const { data } = await worker.recognize(processedUrl, {}, { blocks: true })
      let rawText = normalizeText(data.text)
      
      const { isConfidential, severityFloor } = classifyDocument(rawText)

      // If no PAN card pattern is found in rawText, try PSM 11 (sparse text)
      if (!/\b([A-Z0-9]{5}\s*[0-9OISLZBQG]{4}\s*[A-Z0-9])\b/gi.test(rawText)) {
        console.info('[OCRTier] No PAN found. Running Sparse Pass (PSM 11)...')
        await worker.setParameters({ tessedit_pageseg_mode: '11' as any })
        const { data: sparseData } = await worker.recognize(processedUrl, {}, { blocks: true })
        
        if (/\b([A-Z0-9]{5}\s*[0-9OISLZBQG]{4}\s*[A-Z0-9])\b/gi.test(sparseData.text)) {
          console.info('[OCRTier] Found PAN in Sparse Pass.')
          rawText += '\n' + normalizeText(sparseData.text)
          if ((data as any).words && (sparseData as any).words) {
            (data as any).words.push(...(sparseData as any).words)
          }
        }
        await worker.setParameters({ tessedit_pageseg_mode: '3' as any })
      }

      console.info('[OCRTier] First Pass Extracted Text:', rawText)

      const regexCheck = new RegexTier()
      const firstPassFindings = await regexCheck.run(rawText, config)

      if (isBrowser && activeImageElement) {
        try {
          console.info('[OCRTier] Checking orientation and rotation fallbacks...')
          const isPortrait = activeImageElement.height > activeImageElement.width
          const hasCriticalFinding = firstPassFindings.some(f => f.type === 'aadhaar' || f.type === 'pan_card')

          if (isPortrait || !hasCriticalFinding) {
            console.info(`[OCRTier] Running rotation checks (isPortrait: ${isPortrait}, hasCriticalFinding: ${hasCriticalFinding})…`)
            const rotations = [90, 270, 180]
            
            for (const deg of rotations) {
              console.info(`[OCRTier] Testing rotation: ${deg} degrees…`)
              const rotatedUrl = rotateImageCanvas(activeImageElement, deg)
              const { data: rotatedData } = await worker.recognize(rotatedUrl, {}, { blocks: true })
              const rotatedText = normalizeText(rotatedData.text)

              let finalRotatedText = rotatedText
              if (!/\b([A-Z0-9]{5}\s*[0-9OISLZBQG]{4}\s*[A-Z0-9])\b/gi.test(finalRotatedText)) {
                await worker.setParameters({ tessedit_pageseg_mode: '11' as any })
                const { data: sparseRotatedData } = await worker.recognize(rotatedUrl, {}, { blocks: true })
                if (/\b([A-Z0-9]{5}\s*[0-9OISLZBQG]{4}\s*[A-Z0-9])\b/gi.test(sparseRotatedData.text)) {
                  finalRotatedText += '\n' + normalizeText(sparseRotatedData.text)
                  if ((rotatedData as any).words && (sparseRotatedData as any).words) {
                    (rotatedData as any).words.push(...(sparseRotatedData as any).words)
                  }
                }
                await worker.setParameters({ tessedit_pageseg_mode: '3' as any })
              }

              const rotatedFindings = await regexCheck.run(finalRotatedText, config)
              console.info(`[OCRTier] Extracted text at ${deg} degrees (first 100 chars):`, finalRotatedText.slice(0, 100))
              console.info(`[OCRTier] Rotated findings count at ${deg} degrees:`, rotatedFindings.length)
              
              if (rotatedFindings.length > 0) {
                console.info(`[OCRTier] Successfully found PII at ${deg} degrees! Text length: ${finalRotatedText.length}`)
                const { isConfidential: rotConf, severityFloor: rotSev } = classifyDocument(finalRotatedText)
                currentRotation = deg
                return {
                  rawText: finalRotatedText,
                  ocrData: rotatedData,
                  isConfidential: rotConf,
                  severityFloor: rotSev,
                  rotatedImageUrl: rotatedUrl,
                  scale: currentScale,
                  rotation: currentRotation,
                  imgWidth,
                  imgHeight
                }
              }
            }
          }
        } catch (rotErr) {
          console.warn('[OCRTier] Rotation check encountered an error:', rotErr)
        }
      } else {
        if (firstPassFindings.length > 0) {
          return { rawText, ocrData: data, isConfidential, severityFloor, scale: currentScale, rotation: currentRotation, imgWidth, imgHeight }
        }
      }

      return { rawText, ocrData: data, isConfidential, severityFloor, scale: currentScale, rotation: currentRotation, imgWidth, imgHeight }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Unknown OCR error')
      console.error('[OCRTier] OCR failed:', msg)
      return { rawText: '', ocrData: null, isConfidential: false, severityFloor: 'medium', scale: 1, rotation: 0, imgWidth: 0, imgHeight: 0 }
    }
  }

  mapEntitiesToBboxes(
    entities: PIIEntity[],
    ocrData: any,
    rawText: string,
    severityFloor: any,
    scale: number = 1,
    rotation: number = 0,
    imgWidth: number = 0,
    imgHeight: number = 0
  ): PIIEntity[] {
    return mapEntitiesToBboxes(entities, ocrData, rawText, severityFloor, scale, rotation, imgWidth, imgHeight)
  }
}
