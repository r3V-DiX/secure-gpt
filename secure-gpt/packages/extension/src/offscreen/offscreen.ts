// packages/extension/src/offscreen/offscreen.ts
// Offscreen document — handles OCR, PDF processing, office extraction, and text PII detection.

import { scanDocument, redactDocument, cancelDocument, verifyOfficeDocument } from './document-processor'
import init, { formatFromBytes, formatFromExtension, toMarkdownBytes } from '@firecrawl/anydoc-wasm'
import { detectPII, detectPIIFromImage, warmDocumentDetection } from '@securegpt/detection'
import type { PIIConfig, DetectionResult } from '@securegpt/shared/types'
import {
  runPdfProcessing,
  getRegionsForValues,
  runPdfRedactionLocal,
  dataUrlToUint8Array
} from './pdf-service'

console.log('[Offscreen] Initialized for PII Detection and OCR')

let anydocInit: ReturnType<typeof init> | null = null
async function awaitAnyDocReady(): Promise<void> {
  anydocInit ??= init()
  try { await anydocInit } catch (error) { anydocInit = null; throw error }
}

async function runOfficeProcessing(fileData: string, fileName?: string) {
  try {
    await awaitAnyDocReady()
    const bytes = await dataUrlToUint8Array(fileData)

    let fmt = formatFromBytes(bytes)
    if (!fmt && fileName) {
      const ext = fileName.toLowerCase().split('.').pop() ?? ''
      fmt = formatFromExtension(ext)
    }
    if (!fmt) {
      return { ok: false as const, error: 'unsupported' }
    }

    const text = toMarkdownBytes(bytes, fmt)
    return { ok: true as const, text }
  } catch (err) {
    const code = (err as { code?: string })?.code
    const error = code ?? (err instanceof Error ? err.message : String(err))
    console.error('[Offscreen] Office extraction failed:', error)
    return { ok: false as const, error }
  }
}

// ── Tier singletons ───────────────────────────────────────────────────────────
void warmDocumentDetection().catch(() => console.warn('[Offscreen] Document worker warmup failed; scans will report failures.'))

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'OFFSCREEN_DOCUMENT_CANCEL') {
    cancelDocument(message.key)
    sendResponse({ ok: true })
    return false
  }
  if (message.action === 'OFFSCREEN_DOCUMENT_SCAN') {
    void scanDocument(message.key, message.request, message.config, runOfficeProcessing).then(sendResponse)
    return true
  }
  if (message.action === 'OFFSCREEN_DOCUMENT_REDACT') {
    void redactDocument(message.key, message.entities).then(sendResponse)
    return true
  }
  if (message.action === 'OFFSCREEN_DOCUMENT_VERIFY_OFFICE') {
    void verifyOfficeDocument(message.key, message.dataUrl, message.fileName, message.entities, runOfficeProcessing).then(sendResponse)
    return true
  }

  if (message.action === 'OFFSCREEN_PING') {
    sendResponse({ ok: true })
    return false
  }

  if (message.action === 'OFFSCREEN_RUN_OCR') {
    const { imageUrl, config } = message.data as { imageUrl: string; config: PIIConfig }
    void runImageOcr(imageUrl, config).then(sendResponse)
    return true
  }

  if (message.target === 'offscreen' && message.type === 'DETECT_PII') {
    void handleTextDetection(message.text, message.config).then(sendResponse)
    return true
  }

  if (message.action === 'OFFSCREEN_RUN_PDF') {
    const { pdfData } = message.data
    runPdfProcessing(pdfData)
      .then(result => sendResponse({ ok: true, result }))
      .catch(err => sendResponse({ ok: false, error: String(err) }))
    return true
  }

  if (message.action === 'OFFSCREEN_REDACT_PDF_LOCAL') {
    const { pdfData, entities } = message.data
    runPdfRedactionLocal(pdfData, entities)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ ok: false, error: String(err) }))
    return true
  }

  if (message.action === 'OFFSCREEN_RUN_OFFICE') {
    const { fileData, fileName } = message.data
    runOfficeProcessing(fileData, fileName)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ ok: false, error: String(err) }))
    return true
  }

  if (message.action === 'OFFSCREEN_GET_PDF_REGIONS') {
    const { values } = message.data
    const regions = getRegionsForValues(values)
    sendResponse({ ok: true, regions })
    return false
  }

  return false
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function runImageOcr(
  imageUrl: string,
  config: PIIConfig
): Promise<{ ok: boolean; result?: DetectionResult; error?: string }> {
  try {
    return { ok: true, result: await detectPIIFromImage(imageUrl, config, { strict: true }) }
  } catch {
    return { ok: false, error: 'DOCUMENT_SCAN_FAILED' }
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
