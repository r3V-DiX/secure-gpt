// ─────────────────────────────────────────────
// @securegpt/ocr — Main Pipeline Coordinator
// Composes ImagePreprocessor -> OcrEngine -> OcrPostProcessor
// ─────────────────────────────────────────────

import type {
  OcrEngine,
  OcrPipelineOptions,
  OcrPipelineResult,
} from '../types'
import { ImagePreprocessor } from '../preprocessor/imagePreprocessor'
import { TesseractEngine } from '../engines/tesseractEngine'
import { repairOcrText } from '../postprocessor/glyphRepair'
import { classifyDocumentFuzzy } from '../postprocessor/signals'
import { normalizeText } from '@securegpt/shared/utils/detection-helpers'
import { loadImageElement, rotateImageCanvas } from '../preprocessor/canvasAdapter'

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

export class OcrPipeline {
  private engine: OcrEngine
  private preprocessor: ImagePreprocessor

  constructor(options?: { engine?: OcrEngine; preprocessor?: ImagePreprocessor }) {
    this.engine = options?.engine || new TesseractEngine()
    this.preprocessor = options?.preprocessor || new ImagePreprocessor()
  }

  async initialize(): Promise<void> {
    await this.engine.initialize()
  }

  get isReady(): boolean {
    return this.engine.isReady
  }

  /**
   * Executes full end-to-end OCR extraction on an image URL or base64 payload.
   */
  async processImage(
    imageUrl: string,
    options?: OcrPipelineOptions
  ): Promise<OcrPipelineResult> {
    let processedUrl = imageUrl
    let currentScale = 1
    let currentRotation = 0
    let imgWidth = 0
    let imgHeight = 0
    let activeImageElement: HTMLImageElement | null = null

    // 1. Stage 1 — Universal Image Preprocessing
    if (isBrowser) {
      try {
        const img = await loadImageElement(imageUrl)
        imgWidth = img.width
        imgHeight = img.height
        activeImageElement = img

        const prepResult = await this.preprocessor.processUrl(imageUrl, options?.preprocessing)
        if (prepResult.url) {
          processedUrl = prepResult.url
          currentScale = prepResult.scale
          activeImageElement = await loadImageElement(processedUrl)
        }
      } catch (err) {
        console.warn('[@securegpt/ocr] Preprocessing fallback to raw image:', err)
      }
    }

    // 2. Stage 2 — Primary OCR Pass
    let ocrResult = await this.engine.recognize(processedUrl)
    let rawText = normalizeText(ocrResult.text)

    // Optional Sparse Pass (PSM 11) for scattered identity card details
    const enableSparse = options?.enableSparsePass ?? true
    if (enableSparse && !/\b([A-Z0-9]{5}\s*[0-9OISLZBQG]{4}\s*[A-Z0-9])\b/gi.test(rawText)) {
      try {
        const sparseResult = await this.engine.recognize(processedUrl, { psm: 11 })
        if (/\b([A-Z0-9]{5}\s*[0-9OISLZBQG]{4}\s*[A-Z0-9])\b/gi.test(sparseResult.text)) {
          rawText += '\n' + normalizeText(sparseResult.text)
          ocrResult.words.push(...sparseResult.words)
        }
      } catch (sparseErr) {
        console.warn('[@securegpt/ocr] Sparse pass skipped:', sparseErr)
      }
    }

    // 3. Stage 3 — Multi-angle Auto-Rotation Check if needed
    const enableRotation = options?.enableRotationChecks ?? true
    if (enableRotation && isBrowser && activeImageElement) {
      const isPortrait = activeImageElement.height > activeImageElement.width
      const hasFewWords = ocrResult.words.length < 3

      if (isPortrait || hasFewWords) {
        const rotations = options?.rotationsToTest || [90, 270, 180]
        for (const deg of rotations) {
          try {
            const rotUrl = rotateImageCanvas(activeImageElement, deg)
            const rotResult = await this.engine.recognize(rotUrl)
            const rotText = normalizeText(rotResult.text)

            if (rotResult.words.length > ocrResult.words.length + 2) {
              ocrResult = rotResult
              rawText = rotText
              currentRotation = deg
              processedUrl = rotUrl
              break
            }
          } catch (rotErr) {
            console.warn(`[@securegpt/ocr] Rotation ${deg} test skipped:`, rotErr)
          }
        }
      }
    }

    // 4. Stage 4 — Post-Processing, Glyph Repair & Fuzzy Classification
    const repairedText = repairOcrText(rawText)
    const { isConfidential, severityFloor } = classifyDocumentFuzzy(repairedText)

    return {
      rawText,
      repairedText,
      ocrData: ocrResult,
      isConfidential,
      severityFloor,
      scale: currentScale,
      rotation: currentRotation,
      imgWidth,
      imgHeight,
      processedUrl,
      confidence: ocrResult.confidence,
    }
  }

  async terminate(): Promise<void> {
    await this.engine.terminate()
  }
}
