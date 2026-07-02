// ─────────────────────────────────────────────
// OCR Worker Management
// Tesseract.js worker initialization and lifecycle
// ─────────────────────────────────────────────
//
// NOTE: This module runs inside the Chrome offscreen document (MV3).
// The offscreen document has full DOM + WASM access, so Tesseract.js is
// instantiated directly here — NOT proxied via chrome.runtime.sendMessage.
// A proxy approach does not work because the offscreen document cannot
// receive messages sent from itself.
// ─────────────────────────────────────────────

import { createWorker, PSM } from 'tesseract.js'

declare const chrome: any

export interface OcrWorkerProxy {
  recognize(imageUrl: string, rectangle?: any, options?: any): Promise<{ data: any }>;
  setParameters(params: any): Promise<void>;
  terminate?(): void;
}

type WorkerState =
  | { status: 'unloaded' }
  | { status: 'loading'; promise: Promise<OcrWorkerProxy | null> }
  | { status: 'ready'; worker: OcrWorkerProxy }
  | { status: 'unavailable' }

let workerState: WorkerState = { status: 'unloaded' }
const OCR_LANG = 'eng'

async function loadWorker(): Promise<OcrWorkerProxy | null> {
  try {
    console.info('[OCRTier] Initializing Tesseract.js worker directly...')

    // Detect whether we are running inside a Chrome extension context
    // (offscreen document, content script, or background) to use bundled assets.
    const isExtensionCtx =
      typeof chrome !== 'undefined' && typeof chrome.runtime?.getURL === 'function'

    const options = isExtensionCtx
      ? {
          workerPath: chrome.runtime.getURL('ocr/worker.min.js'),
          corePath:   chrome.runtime.getURL('ocr/tesseract-core.wasm.js'),
          langPath:   chrome.runtime.getURL('ocr'),
          // CRITICAL: blob: URLs are blocked by LLM site CSPs; disabled here.
          workerBlobURL: false,
          gzip: true,
          logger: (m: { status: string; progress: number }) =>
            console.debug(`[Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`),
        }
      : {
          // Fallback for Node / Jest / non-extension environments
          logger: (m: { status: string; progress: number }) =>
            console.debug(`[Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`),
        }

    const worker = await createWorker(OCR_LANG, 1, options)
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })

    console.info('[OCRTier] Tesseract worker ready.')
    return worker as unknown as OcrWorkerProxy

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown worker error')
    console.warn('[OCRTier] Worker initialization failed:', msg)
    return null
  }
}

export async function getOcrWorker(): Promise<OcrWorkerProxy | null> {
  if (workerState.status === 'ready') return workerState.worker
  if (workerState.status === 'unavailable') return null

  if (workerState.status === 'unloaded') {
    const promise = loadWorker().then((w) => {
      workerState = w ? { status: 'ready', worker: w } : { status: 'unavailable' }
      return w
    })
    workerState = { status: 'loading', promise }
    return promise
  }

  return (workerState as { status: 'loading'; promise: Promise<OcrWorkerProxy | null> }).promise
}

export function resetOcrWorker(): void {
  if (workerState.status === 'ready') {
    workerState.worker.terminate?.()
  }
  workerState = { status: 'unloaded' }
}
