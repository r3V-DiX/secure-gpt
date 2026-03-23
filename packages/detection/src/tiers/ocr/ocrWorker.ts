// ─────────────────────────────────────────────
// OCR Worker Management
// Tesseract.js worker initialization and lifecycle
// ─────────────────────────────────────────────

import { createWorker, PSM } from 'tesseract.js'

declare const chrome: any

export interface OcrWorkerProxy {
  recognize(imageUrl: string): Promise<{ data: any }>;
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

const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

async function loadWorker(): Promise<OcrWorkerProxy | null> {
  try {
    console.info('[OCRTier] Initializing OCR Worker Proxy...')

    if (isExtension) {
      const proxy: OcrWorkerProxy = {
        async recognize(imageUrl: string) {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              target: 'offscreen-ocr',
              action: 'recognize',
              imageUrl
            }, (response: any) => {
              if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
              }
              if (response && response.error) {
                return reject(new Error(response.error));
              }
              resolve({ data: response?.data });
            });
          });
        },
        async setParameters(params: any) {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              target: 'offscreen-ocr',
              action: 'setParameters',
              params
            }, (response: any) => {
              if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
              }
              if (response && response.error) {
                return reject(new Error(response.error));
              }
              resolve();
            });
          });
        }
      };

      // Initial ping
      await new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage({
          target: 'offscreen-ocr',
          action: 'init'
        }, (response: any) => {
          if (chrome.runtime.lastError) {
            console.warn('[OCRTier] Init message ignored or offscreen doc not ready:', chrome.runtime.lastError.message);
            resolve();
          } else if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        });
      });

      console.info('[OCRTier] Extension Proxy OCR Worker ready')
      return proxy;
    } else {
      // Direct instanciation (Node / Test / Dashboard environment)
      const worker = await createWorker(OCR_LANG, 1, {})
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      })
      console.info('[OCRTier] Standard Tesseract worker ready')
      return worker as unknown as OcrWorkerProxy;
    }

  } catch (err) {
    console.warn('[OCRTier] Worker initialization failed:', (err as Error).message)
    return null
  }
}

export async function getOcrWorker(): Promise<OcrWorkerProxy | null> {
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
    if (workerState.worker.terminate) {
      workerState.worker.terminate()
    }
  }
  workerState = { status: 'unloaded' }
}
