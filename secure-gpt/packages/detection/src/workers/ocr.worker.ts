// ─────────────────────────────────────────────
// OCR Offscreen Document Worker
// Runs Tesseract WASM safely in Chrome Extension
// ─────────────────────────────────────────────

import { createWorker, type Worker, PSM } from 'tesseract.js';

declare const chrome: any;

const OCR_LANG = 'eng';
let workerPromise: Promise<Worker> | null = null;
let currentWorker: Worker | null = null;

async function getOffscreenWorker() {
  if (currentWorker) return currentWorker;
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    try {
      const isExtension = typeof chrome !== 'undefined' && chrome.runtime?.getURL;
      const options: any = isExtension ? {
        workerPath: chrome.runtime.getURL('ocr/worker.min.js'),
        corePath: chrome.runtime.getURL('ocr/tesseract-core.wasm.js'),
        langPath: chrome.runtime.getURL('ocr'),
        workerBlobURL: false, // Critical for CSP bypass
        gzip: true,
      } : {};

      const worker = await createWorker(OCR_LANG, 1, options);
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });

      currentWorker = worker;
      return worker;
    } catch (err) {
      workerPromise = null;
      throw err;
    }
  })();

  return workerPromise;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    if (message.target !== 'offscreen-ocr') return false;

    if (message.action === 'init') {
      getOffscreenWorker()
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ error: err.message }));
      return true; // Keeps the message channel open for async response
    }
    
    if (message.action === 'recognize') {
      getOffscreenWorker()
        .then(async worker => {
          try {
            const result = await worker.recognize(message.imageUrl);
            sendResponse({ data: result.data });
          } catch (err) {
            sendResponse({ error: (err as Error).message });
          }
        })
        .catch(err => sendResponse({ error: err.message }));
      return true;
    }

    if (message.action === 'setParameters') {
      getOffscreenWorker()
        .then(async worker => {
          try {
            await worker.setParameters(message.params);
            sendResponse({ success: true });
          } catch (err) {
            sendResponse({ error: (err as Error).message });
          }
        })
        .catch(err => sendResponse({ error: err.message }));
      return true;
    }

    return false;
  });
}

