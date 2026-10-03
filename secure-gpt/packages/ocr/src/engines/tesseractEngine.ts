// ─────────────────────────────────────────────
// Tesseract OCR Engine Adapter
// Dual-mode: Native Tesseract CLI in Node.js (with exact TSV pixel bounding boxes)
// + Tesseract.js Worker in Browser
// ─────────────────────────────────────────────

import { createWorker, PSM } from 'tesseract.js'
import type {
  OcrEngine,
  OcrEngineOptions,
  OcrEngineResult,
  OcrWord,
  OcrBlock,
} from '../types'
import { getNodeModules, runNativeTesseractCli } from './nativeTesseractHelper'

declare const chrome: any

export class TesseractEngine implements OcrEngine {
  readonly name = 'tesseract'
  private worker: any = null
  private initializingPromise: Promise<void> | null = null
  private language: string
  private hasNativeTesseract: boolean = false
  private recognitionQueue: Promise<unknown> = Promise.resolve()
  private lifecycle = 0

  constructor(language: string = 'eng') {
    this.language = language
    this.detectNative()
  }

  private detectNative() {
    const node = getNodeModules()
    if (node) {
      try {
        node.execSync('which tesseract 2>/dev/null', { stdio: 'ignore' })
        this.hasNativeTesseract = true
      } catch {
        this.hasNativeTesseract = false
      }
    }
  }

  get isReady(): boolean {
    return this.hasNativeTesseract || this.worker !== null
  }

  async initialize(): Promise<void> {
    if (this.hasNativeTesseract) return
    if (this.worker) return
    if (this.initializingPromise) return this.initializingPromise
    const lifecycle = this.lifecycle

    this.initializingPromise = (async () => {
      try {
        const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node)
        const hasWorker = typeof Worker !== 'undefined' || isNode
        if (!hasWorker) throw new Error('OCR_WORKER_UNAVAILABLE')

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
          const node = getNodeModules()
          if (node) {
            try {
              const candidates = [
                node.path.resolve(__dirname, '../../../../extension/public/ocr'),
                node.path.resolve(process.cwd(), 'packages/extension/public/ocr'),
                node.path.resolve(process.cwd(), '../extension/public/ocr'),
              ]
              for (const cand of candidates) {
                if (node.fs.existsSync(node.path.join(cand, 'eng.traineddata.gz'))) {
                  options.langPath = cand
                  break
                }
              }
            } catch {}
          }
        }

        const worker = await createWorker(this.language, 1, options)
        if (lifecycle !== this.lifecycle) { void worker.terminate(); throw new Error('OCR_CANCELLED') }
        this.worker = worker

        await this.worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO,
          preserve_interword_spaces: '1',
        })
      } catch (err) {
        if (lifecycle === this.lifecycle) this.worker = null
        throw new Error('OCR_INITIALIZATION_FAILED')
      } finally {
        if (lifecycle === this.lifecycle) this.initializingPromise = null
      }
    })()

    return this.initializingPromise
  }

  async recognize(
    imageInput: string | ImageData,
    options?: OcrEngineOptions
  ): Promise<OcrEngineResult> {
    const operation = this.recognitionQueue.then(() => this.recognizeExclusive(imageInput, options))
    this.recognitionQueue = operation.catch(() => undefined)
    return operation
  }

  private async recognizeExclusive(imageInput: string | ImageData, options?: OcrEngineOptions): Promise<OcrEngineResult> {
    options?.signal?.throwIfAborted()
    let abort: (() => void) | undefined
    const stopped = new Promise<never>((_, reject) => {
      abort = () => {
        this.lifecycle++
        const worker = this.worker
        this.worker = null
        this.initializingPromise = null
        if (worker) void worker.terminate().catch(() => undefined)
        reject(new Error('OCR_RECOGNITION_FAILED'))
      }
      options?.signal?.addEventListener('abort', abort, { once: true })
    })
    try { return await Promise.race([this.recognizeWork(imageInput, options), stopped]) }
    finally { if (abort) options?.signal?.removeEventListener('abort', abort) }
  }

  private async recognizeWork(imageInput: string | ImageData, options?: OcrEngineOptions): Promise<OcrEngineResult> {
    options?.signal?.throwIfAborted()
    // 1. Native CLI execution in Node.js
    if (this.hasNativeTesseract && typeof imageInput === 'string') {
      return runNativeTesseractCli(imageInput, this.language, options)
    }

    // 2. Tesseract.js Worker execution
    if (!this.worker) {
      await this.initialize()
    }

    if (!this.worker) {
      throw new Error('OCR_WORKER_UNAVAILABLE')
    }
    options?.signal?.throwIfAborted()
    const worker = this.worker

    try {
      if (options?.psm !== undefined) {
        await worker.setParameters({ tessedit_pageseg_mode: options.psm })
      }

      if (options?.whitelist !== undefined) {
        await worker.setParameters({ tessedit_char_whitelist: options.whitelist })
      }

      // The document job owns the deadline. Cancellation releases this worker
      // and the serialization queue instead of leaving a recognition running.
      options?.signal?.throwIfAborted()
      const response = await worker.recognize(imageInput)
      const { data } = response

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

      if (options?.psm !== undefined) {
        await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
      }

      return {
        text: data.text || '',
        confidence: data.confidence || 0,
        words,
        blocks,
        raw: data,
      }
    } catch (recErr) {
      console.warn('[TesseractEngine] Recognition failed or timed out:', recErr)
      if (this.worker === worker) {
        try {
          await this.worker.terminate()
        } catch {}
        this.worker = null
      }
      throw new Error('OCR_RECOGNITION_FAILED')
    }
  }

  async setParameters(params: Record<string, any>): Promise<void> {
    if (!this.worker && !this.hasNativeTesseract) await this.initialize()
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
