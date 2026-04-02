// packages/extension/src/offscreen/offscreen.ts
// Offscreen document — handles OCR and text PII detection.
//
// Message protocol (mirrors reference implementation):
//   OFFSCREEN_PING      → { ok: true }         (readiness check from background)
//   OFFSCREEN_RUN_OCR   → { ok, result }        (image OCR via Tesseract, in-process)
//   target:'offscreen' + type:'DETECT_PII' → DetectionResult   (text detection)

import { detectPII, OCRTier, RegexTier } from '@securegpt/detection'
import type { PIIConfig, DetectionResult } from '@securegpt/shared/types'

console.log('[Offscreen] Initialized for PII Detection and OCR')

// ── Tier singletons — Tesseract runs directly in this context ─────────────────
const ocrTier = new OCRTier()
const regexTier = new RegexTier()

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Readiness check — background pings this before proxying OCR work
  if (message.action === 'OFFSCREEN_PING') {
    sendResponse({ ok: true })
    return false
  }

  // OCR request — run Tesseract directly in this context, return DetectionResult
  if (message.action === 'OFFSCREEN_RUN_OCR') {
    const { imageUrl, config } = message.data as { imageUrl: string; config: PIIConfig }
    void runImageOcr(imageUrl, config).then(sendResponse)
    return true
  }

  // Text PII detection
  if (message.target === 'offscreen' && message.type === 'DETECT_PII') {
    void handleTextDetection(message.text, message.config).then(sendResponse)
    return true
  }

  return false
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function runImageOcr(
  imageUrl: string,
  config: PIIConfig
): Promise<{ ok: boolean; result?: DetectionResult; error?: string }> {
  try {
    console.log('[Offscreen] Running OCR on image…')
    const { rawText, ocrData, severityFloor } = await ocrTier.runOnImage(imageUrl, config)

    if (!rawText) {
      return {
        ok: true,
        result: { hasFindings: false, entities: [], tier: 'ocr', processingTimeMs: 0, inputLength: 0 }
      }
    }

    // Find entities in extracted text
    const foundEntities = await regexTier.run(rawText, config)

    // Map entities back to image bounding boxes
    const mappedEntities = ocrTier.mapEntitiesToBboxes(foundEntities, ocrData, rawText, severityFloor)

    const result: DetectionResult = {
      hasFindings: mappedEntities.length > 0,
      entities: mappedEntities,
      tier: 'ocr',
      processingTimeMs: 0,
      inputLength: rawText.length,
    }

    console.log(`[Offscreen] OCR complete — ${rawText.length} chars, ${mappedEntities.length} entities`)
    return { ok: true, result }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown OCR error')
    console.error('[Offscreen] Image OCR failed:', msg)
    return { ok: false, error: msg }
  }
}

async function handleTextDetection(text: string, config: PIIConfig): Promise<DetectionResult> {
  try {
    console.log('[Offscreen] Running text detection, length:', text.length)
    const result = await detectPII(text, config)
    console.log('[Offscreen] Text detection complete, findings:', result.hasFindings)
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error')
    console.error('[Offscreen] Text detection failed:', msg)
    return { hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: text.length }
  }
}

export {}
