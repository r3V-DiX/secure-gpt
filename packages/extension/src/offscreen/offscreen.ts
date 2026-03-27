// packages/extension/src/offscreen/offscreen.ts
import { detectPII } from '@securegpt/detection'
import type { PIIConfig, DetectionResult } from '@securegpt/shared/types'

console.log('[Offscreen] Initialized for PII Detection and OCR')

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return

  switch (message.type) {
    case 'DETECT_PII':
      void handleDetection(message.text, message.config).then(sendResponse)
      return true

    case 'OCR_IMAGE':
      void handleOCR(message.imageData).then(sendResponse)
      return true

    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

async function handleDetection(text: string, config: PIIConfig): Promise<DetectionResult> {
  try {
    console.log('[Offscreen] Running detection on text length:', text.length)
    const result = await detectPII(text, config)
    console.log('[Offscreen] Detection complete, findings:', result.hasFindings)
    return result
  } catch (err) {
    console.error('[Offscreen] Detection failed in offscreen:', err)
    return {
      hasFindings: false,
      entities: [],
      tier: 'regex',
      processingTimeMs: 0,
      inputLength: text.length
    }
  }
}

async function handleOCR(_imageData: string): Promise<{ text: string; confidence: number }> {
  // OCR implementation stub
  return { text: '', confidence: 0 }
}

export {}
