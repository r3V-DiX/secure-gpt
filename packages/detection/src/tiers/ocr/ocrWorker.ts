// ─────────────────────────────────────────────
// OCR Worker Management
// Tesseract.js worker initialization and lifecycle
// ─────────────────────────────────────────────

import { createWorker, type Worker, PSM } from 'tesseract.js'

declare const chrome: any

type WorkerState =
  | { status: 'unloaded' }
  | { status: 'loading'; promise: Promise<Worker | null> }
  | { status: 'ready'; worker: Worker }
  | { status: 'unavailable' }

let workerState: WorkerState = { status: 'unloaded' }
const OCR_LANG = 'eng'

async function loadWorker(): Promise<Worker | null> {
  try {
    console.info('[OCRTier] Initializing Tesseract.js worker...')

    // Use bundled extension assets if available
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime?.getURL
    const options: any = isExtension ? {
      workerPath: chrome.runtime.getURL('ocr/worker.min.js'),
      corePath: chrome.runtime.getURL('ocr/tesseract-core.wasm.js'),
      langPath: chrome.runtime.getURL('ocr'),
      workerBlobURL: false, // Critical for CSP bypass
      gzip: true,
    } : {}

    const worker = await createWorker(OCR_LANG, 1, options)

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    })

    console.info('[OCRTier] Tesseract worker ready')
    return worker
  } catch (err) {
    console.warn('[OCRTier] Worker initialization failed:', (err as Error).message)
    return null
  }
}

export async function getOcrWorker(): Promise<Worker | null> {
  if (workerState.status === 'ready') return workerState.worker
  if (workerState.status === 'unavailable') return null

  if (workerState.status === 'unloaded') {
    const promise = loadWorker().then((w) => {
      if (w) {
        workerState = { status: 'ready', worker: w }
      } else {
        workerState = { status: 'unavailable' }
      }
      return w
    })
    workerState = { status: 'loading', promise }
    return promise
  }

  return (workerState as any).promise
}

export function resetOcrWorker(): void {
  if (workerState.status === 'ready') {
    workerState.worker.terminate()
  }
  workerState = { status: 'unloaded' }
}
