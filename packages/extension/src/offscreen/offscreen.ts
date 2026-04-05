// packages/extension/src/offscreen/offscreen.ts
// Offscreen document — handles OCR and text PII detection.
//
// Message protocol (mirrors reference implementation):
//   OFFSCREEN_PING      → { ok: true }         (readiness check from background)
//   OFFSCREEN_RUN_OCR   → { ok, result }        (image OCR via Tesseract, in-process)
//   target:'offscreen' + type:'DETECT_PII' → DetectionResult   (text detection)

import { detectPII, OCRTier, RegexTier } from '@securegpt/detection'
import type { PIIConfig, DetectionResult } from '@securegpt/shared/types'
import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('assets/pdf.worker.min.mjs')

console.log('[Offscreen] Initialized for PII Detection and OCR')

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  textItems: PdfTextItem[];
}

interface PdfRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

let lastPdfPages: PdfPageInfo[] = []

async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const resp = await fetch(dataUrl)
  const arrayBuffer = await resp.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

async function runPdfProcessing(pdfData: string) {
  const uint8Array = await dataUrlToUint8Array(pdfData)
  const loadingTask = pdfjs.getDocument({ data: uint8Array })
  const pdf = await loadingTask.promise
  let fullText = ''
  const pages: PdfPageInfo[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()
    
    const items = textContent.items.map((item: any) => ({
      str: item.str || '',
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0,
      width: item.width ?? 0,
      height: item.height ?? 0
    }))

    const pageText = items.map((it: any) => it.str).join(' ')
    fullText += `--- Page ${i} ---\n` + pageText + '\n'
    
    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      textItems: items
    })
  }

  lastPdfPages = pages

  return {
    numPages: pdf.numPages,
    fullText,
    pages
  }
}

function getRegionsForValues(values: string[]) {
  const regions: PdfRegion[] = []
  const lowerValues = values.map((v) => v.toLowerCase().trim()).filter((v) => v.length > 1)

  lastPdfPages.forEach((page, pageIdx) => {
    page.textItems.forEach((item) => {
      const itemText = (item.str || '').toLowerCase()
      for (const val of lowerValues) {
        if (itemText.includes(val)) {
          regions.push({
            page: pageIdx,
            x: item.x,
            y: page.height - item.y - (item.height || 12),
            width: item.width || (val.length * 6),
            height: item.height || 12
          })
          break
        }
      }
    })
  })

  return regions
}

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

  if (message.action === 'OFFSCREEN_RUN_PDF') {
    const { pdfData } = message.data
    runPdfProcessing(pdfData)
      .then(result => sendResponse({ ok: true, result }))
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
