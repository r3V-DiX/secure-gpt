// ─────────────────────────────────────────────
// Offscreen Document
// Runs Tesseract OCR in Chrome offscreen context
// This avoids WASM restrictions in service workers
// ─────────────────────────────────────────────

// TODO (AI dev): Implement Tesseract.js WASM OCR here
// This document has access to the DOM and can run WASM

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return

  switch (message.type) {
    case 'OCR_IMAGE':
      void handleOCR(message.imageData).then(sendResponse)
      return true

    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

async function handleOCR(_imageData: string): Promise<{ text: string; confidence: number }> {
  // TODO (AI dev):
  // 1. Initialize Tesseract.js worker
  // 2. Load eng.traineddata
  // 3. Run OCR on imageData (base64)
  // 4. Return extracted text + confidence

  // Stub response
  return { text: '', confidence: 0 }
}

export {}
