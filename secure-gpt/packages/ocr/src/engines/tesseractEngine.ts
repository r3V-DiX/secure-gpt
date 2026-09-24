// ─────────────────────────────────────────────
// Tesseract.js OCR Engine Adapter
// Handles worker lifecycle, DPI calibration, and output normalization
// ─────────────────────────────────────────────

import { createWorker, PSM } from 'tesseract.js'
import type {
  OcrEngine,
  OcrEngineOptions,
  OcrEngineResult,
  OcrWord,
  OcrBlock,
} from '../types'

declare const chrome: any

export class TesseractEngine implements OcrEngine {
  readonly name = 'tesseract'
  private worker: any = null
  private initializingPromise: Promise<void> | null = null
  private language: string

  constructor(language: string = 'eng') {
    this.language = language
  }

  get isReady(): boolean {
    return this.worker !== null
  }

  async initialize(): Promise<void> {
    if (this.worker) return
    if (this.initializingPromise) return this.initializingPromise

    this.initializingPromise = (async () => {
      try {
        const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node)
        const isExtensionCtx =
          !isNode &&
          typeof chrome !== 'undefined' &&
          typeof chrome.runtime?.getURL === 'function'

        let options: any = { gzip: true }

        if (isExtensionCtx) {
          options = {
            workerPath: chrome.runtime.getURL('ocr/worker.min.js'),
            corePath: chrome.runtime.getURL('ocr/tesseract-core.wasm.js'),
            langPath: chrome.runtime.getURL('ocr'),
            workerBlobURL: false,
            gzip: true,
          }
        } else if (isNode) {
          try {
            const fs = await import('fs')
            const path = await import('path')
            const candidates = [
              path.resolve(__dirname, '../../../../extension/public/ocr'),
              path.resolve(process.cwd(), 'packages/extension/public/ocr'),
              path.resolve(process.cwd(), '../extension/public/ocr'),
            ]
            for (const cand of candidates) {
              if (fs.existsSync(path.join(cand, 'eng.traineddata.gz'))) {
                options.langPath = cand
                break
              }
            }
          } catch {}
        }

        this.worker = await createWorker(this.language, 1, options)

        // Calibrate engine parameters for maximum accuracy on screenshots / text
        await this.worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO,
          user_defined_dpi: '300',
          preserve_interword_spaces: '1',
        })
      } catch (err) {
        this.worker = null
        console.warn('[TesseractEngine] Initialization failed:', err)
      } finally {
        this.initializingPromise = null
      }
    })()

    return this.initializingPromise
  }

  async recognize(
    imageInput: string | ImageData,
    options?: OcrEngineOptions
  ): Promise<OcrEngineResult> {
    if (!this.worker) {
      await this.initialize()
    }

    if (!this.worker) {
      return { text: '', confidence: 0, words: [], blocks: [] }
    }

    try {
      if (options?.psm !== undefined) {
        await this.worker.setParameters({ tessedit_pageseg_mode: options.psm })
      }

      if (options?.whitelist !== undefined) {
        await this.worker.setParameters({ tessedit_char_whitelist: options.whitelist })
      }

      const { data } = await this.worker.recognize(imageInput, {}, { blocks: true })

      const words: OcrWord[] = (data.words || []).map((w: any) => ({
        text: w.text || '',
        confidence: w.confidence || 0,
        bbox: {
          x0: w.bbox?.x0 || 0,
          y0: w.bbox?.y0 || 0,
          x1: w.bbox?.x1 || 0,
          y1: w.bbox?.y1 || 0,
        },
        baseline: w.baseline,
      }))

      const blocks: OcrBlock[] = (data.blocks || []).map((b: any) => ({
        text: b.text || '',
        confidence: b.confidence || 0,
        bbox: {
          x0: b.bbox?.x0 || 0,
          y0: b.bbox?.y0 || 0,
          x1: b.bbox?.x1 || 0,
          y1: b.bbox?.y1 || 0,
        },
        words: (b.words || []).map((w: any) => ({
          text: w.text || '',
          confidence: w.confidence || 0,
          bbox: {
            x0: w.bbox?.x0 || 0,
            y0: w.bbox?.y0 || 0,
            x1: w.bbox?.x1 || 0,
            y1: w.bbox?.y1 || 0,
          },
        })),
      }))

      // Reset PSM to AUTO if custom PSM was used
      if (options?.psm !== undefined) {
        await this.worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
      }

      return {
        text: data.text || '',
        confidence: data.confidence || 0,
        words,
        blocks,
        raw: data,
      }
    } catch (recErr) {
      console.warn('[TesseractEngine] Recognition failed:', recErr)
      return { text: '', confidence: 0, words: [], blocks: [] }
    }
  }

  async setParameters(params: Record<string, any>): Promise<void> {
    if (!this.worker) await this.initialize()
    if (this.worker) {
      await this.worker.setParameters(params)
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}
