// ─────────────────────────────────────────────
// @securegpt/ocr — Main Pipeline Coordinator
// Composes ImagePreprocessor -> OcrEngine -> OcrPostProcessor
// ─────────────────────────────────────────────

import type {
  OcrEngine,
  OcrEngineResult,
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

export function recognitionScore(result: OcrEngineResult): number {
  // Confidence alone can prefer five easy words in the wrong orientation over
  // an entire page. Reward the amount of confidently recognized text as well.
  return result.words.reduce((sum, word) => sum + word.text.replace(/\W/g, '').length * Math.max(0, word.confidence - 20), 0)
}

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
   * Executes full end-to-end OCR extraction on an image URL, base64 payload, or file path.
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
    try {
      if (isBrowser) {
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
      } else {
        const prepResult = await this.preprocessor.processUrl(imageUrl, options?.preprocessing)
        if (prepResult.url) {
          processedUrl = prepResult.url
          currentScale = prepResult.scale
        }
      }
    } catch (err) {
      console.warn('[@securegpt/ocr] Preprocessing fallback to raw image:', err)
    }

    // Retry based on recognition quality, never on the presence of a particular
    // country's ID. Clear ordinary documents should not incur eight OCR passes.
    const recognize = async (url: string, psm: number) => {
      options?.signal?.throwIfAborted()
      const start = performance.now()
      const result = await this.engine.recognize(url, { psm, signal: options?.signal })
      console.info('[OCR pass]', JSON.stringify({ psm, milliseconds: Math.round(performance.now() - start), words: result.words.length, confidence: result.confidence }))
      return result
    }
    const hasId = (text: string) => /\b\d{4}\s*\d{4}\s*\d{4}\b/i.test(text) || /\b[A-Z]{5}\s*[0-9]{4}\s*[A-Z]\b/i.test(text)
    const adequate = (result: OcrEngineResult) => (result.words.length >= 5 && result.confidence >= 75 && hasId(result.text))
    let ocrResult = await recognize(processedUrl, 11)
    if (!adequate(ocrResult) && options?.enableSparsePass !== false) {
      const fallback = await recognize(processedUrl, 3)
      if (recognitionScore(fallback) > recognitionScore(ocrResult) || !ocrResult.words.length) {
        ocrResult = fallback
      }
    }

    if (!hasId(ocrResult.text) && options?.enableRotationChecks !== false && isBrowser && activeImageElement) {
      for (const deg of options?.rotationsToTest ?? [270, 90, 180]) {
        const rotUrl = rotateImageCanvas(activeImageElement, deg)
        let candidate = await recognize(rotUrl, 11)
        if (!hasId(candidate.text) && options?.enableSparsePass !== false) {
          const sparse = await recognize(rotUrl, 3)
          if (recognitionScore(sparse) > recognitionScore(candidate)) candidate = sparse
        }
        if (candidate.words.length && (hasId(candidate.text) || recognitionScore(candidate) > recognitionScore(ocrResult) || !ocrResult.words.length)) {
          ocrResult = candidate
          currentRotation = deg
          processedUrl = rotUrl
        }
        if (hasId(ocrResult.text)) break
      }
    }
    options?.signal?.throwIfAborted()
    const rawText = normalizeText(ocrResult.text)

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
