// packages/extension/src/background/detection-handler.ts
import type { PIIConfig, DetectionResult, AuditLog, PIIEntity } from '@securegpt/shared/types'
import { detectPII } from '@securegpt/detection'
import { v4 as uuidv4 } from 'uuid'
import { EXTENSION_VERSION } from '@/config/defaults.config'
import { DASHBOARD_URL } from '@/config/api.config'
import apiClient from '@/lib/api/client'
import { queueLog } from './log-batcher'
import { DOMAIN_TO_PLATFORM } from '@securegpt/shared/constants'

let creating: Promise<void> | null = null

async function setupOffscreen() {
  const offscreenUrl = chrome.runtime.getURL('offscreen/index.html')

  if (typeof chrome.runtime.getContexts !== 'undefined') {
    const existing = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [offscreenUrl]
    })
    if (existing.length > 0) return
  }

  if (creating) {
    await creating
    return
  }

  try {
    creating = chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Run Tesseract.js OCR engine in a worker-enabled context'
    })
    await creating
  } catch (err) {
    if (!String(err).includes('Only a single offscreen document may be created')) {
      console.error('[Background] Failed to create offscreen document:', err)
    }
  } finally {
    creating = null
  }
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function handleDetectPII(
  text: string,
  config: PIIConfig,
  _sender?: chrome.runtime.MessageSender
): Promise<DetectionResult> {
  try {
    console.log(`[Background] Running text detection directly (Policy v${config.version})...`)
    const result = await detectPII(text, config)
    console.log('[Background] Detection complete, findings:', result.hasFindings)
    return result
  } catch (err) {
    console.error('[Background] Text detection failed:', err)
    return {
      hasFindings: false,
      entities: [],
      tier: 'regex',
      processingTimeMs: 0,
      inputLength: text.length
    }
  }
}

export async function handleDetectPIIImage(
  imgUrl: string,
  config: PIIConfig,
  _sender?: chrome.runtime.MessageSender
): Promise<DetectionResult> {
  const empty: DetectionResult = { hasFindings: false, entities: [], tier: 'ocr', processingTimeMs: 0, inputLength: 0 }

  try {
    console.log('[Background] Proxying OCR request to offscreen document...')
    await setupOffscreen()

    let isReady = false
    for (let i = 0; i < 15; i++) {
      try {
        const ping: { ok: boolean } = await chrome.runtime.sendMessage({ action: 'OFFSCREEN_PING' })
        if (ping?.ok) { isReady = true; break }
      } catch (_e) {
        console.debug(`[Background] Offscreen not ready yet (attempt ${i + 1}), waiting…`)
      }
      await new Promise((r) => setTimeout(r, 300))
    }

    if (!isReady) {
      console.error('[Background] Offscreen document failed to respond to PING after retries.')
      return empty
    }

    const response: { ok: boolean; result?: DetectionResult; error?: string } =
      await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_RUN_OCR',
        data: { imageUrl: imgUrl, config }
      })

    if (!response?.ok || !response.result) {
      console.error('[Background] Offscreen OCR returned error:', response?.error)
      return empty
    }

    const result = response.result
    console.log('[Background] Image OCR complete, findings:', result.hasFindings)
    return result
  } catch (err) {
    console.error('[Background] Failed to proxy image OCR:', err)
    return empty
  }
}

export async function handleDetectPIIPDF(
  pdfData: string,
  config: PIIConfig,
  sender?: chrome.runtime.MessageSender
): Promise<DetectionResult> {
  const empty: DetectionResult = { hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: 0 }

  try {
    console.log('[Background] Proxying PDF extract to offscreen document...')
    await setupOffscreen()

    let isReady = false
    for (let i = 0; i < 15; i++) {
      try {
        const ping: { ok: boolean } = await chrome.runtime.sendMessage({ action: 'OFFSCREEN_PING' })
        if (ping?.ok) { isReady = true; break }
      } catch (_e) {
        console.debug(`[Background] Offscreen not ready yet (attempt ${i + 1}), waiting…`)
      }
      await new Promise((r) => setTimeout(r, 300))
    }

    if (!isReady) {
      console.error('[Background] Offscreen document failed to respond to PING after retries.')
      return empty
    }

    const response: { ok: boolean; result?: any; error?: string } =
      await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_RUN_PDF',
        data: { pdfData }
      })

    if (!response?.ok || !response.result) {
      console.error('[Background] Offscreen PDF returned error:', response?.error)
      return empty
    }

    const fullText = response.result.fullText
    return await handleDetectPII(fullText, config, sender)
  } catch (err) {
    console.error('[Background] Failed to proxy PDF detection:', err)
    return empty
  }
}

export async function handleRedactPDF(
  pdfData: string,
  entities: PIIEntity[],
  manualRegions: any[] = []
): Promise<{ ok: boolean; redactedPdfData?: string; error?: string }> {
  try {
    console.log('[Background] Sending PDF to backend for secure redaction...')

    const textValues = (entities || [])
      .filter((e: any) => !e.bboxes || e.bboxes.length === 0)
      .map((e: any) => e.value)

    let autoRegions: any[] = []
    if (textValues.length > 0) {
      console.debug('[Background] Mapping text values to coordinates via offscreen...')

      // Bug 19 fix: ensure offscreen is alive before requesting region mapping.
      // If the document was recycled, lastPdfPages would be empty and all
      // text-based regions would silently come back empty.
      await setupOffscreen()

      const mappingResp = await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_GET_PDF_REGIONS',
        data: { values: textValues }
      })
      if (mappingResp?.ok && Array.isArray(mappingResp.regions) && mappingResp.regions.length > 0) {
        autoRegions = mappingResp.regions
      } else {
        console.warn('[Background] PDF region mapping returned empty — offscreen state may be stale')
      }
    }

    const entitiesWithBboxes = (entities || [])
      .filter((e: any) => e.bboxes && e.bboxes.length > 0)
      .flatMap((e: any) => e.bboxes.map((b: any) => ({
        page: 0,
        x: b.x0,
        y: b.y0,
        width: b.x1 - b.x0,
        height: b.y1 - b.y0
      })))

    const regions = [...autoRegions, ...entitiesWithBboxes, ...manualRegions]
    const validRegions = regions.filter(r => r.width > 0 && r.height > 0)

    // Bug 5 fix: was using raw fetch() pointing directly to API_BASE_URL with no
    // credentials. The session cookie lives on the dashboard domain so direct backend
    // calls always 401 in production. Use apiClient (Axios, withCredentials: true,
    // proxied through the dashboard URL) to match every other API call in this file.
    const resp = await fetch(pdfData)
    const pdfBlob = await resp.blob()

    const formData = new FormData()
    formData.append('file', pdfBlob, 'document.pdf')
    console.info(`[Background] Sending ${validRegions.length} redaction regions to backend.`)
    formData.append('regions', JSON.stringify(validRegions))

    const backendResp = await apiClient.post<Blob>(
      `${DASHBOARD_URL}/api/v1/redact/pdf`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        timeout: 30000,
      }
    )

    const redactedBlob = backendResp.data
    const reader = new FileReader()
    const redactedDataUri = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(redactedBlob)
    })

    return { ok: true, redactedPdfData: redactedDataUri }
  } catch (err) {
    console.error('[Background] Backend Redaction failed:', err)
    return { ok: false, error: String(err) }
  }
}

const ACTION_PRIORITY: Record<string, number> = {
  BLOCK: 3,
  MASK: 2,
  WARN_ALLOW: 1,
  ALLOW: 0,
}

export async function _logBackgroundDetection(
  result: DetectionResult,
  _text: string,
  config: PIIConfig,
  sender?: chrome.runtime.MessageSender
) {
  try {
    if (result.entities.length === 0) return

    let maxPriority = -1
    let finalAction = 'ALLOW'
    let topEntity = result.entities[0]!

    for (const entity of result.entities) {
      const action = config.categories[entity.category]?.action ?? 'ALLOW'
      const priority = ACTION_PRIORITY[action] ?? 0
      if (priority > maxPriority) {
        maxPriority = priority
        finalAction = action
        topEntity = entity
      }
    }

    const snippetHash = await sha256(topEntity.value)
    const entityTypes = [...new Set(result.entities.map((e) => e.type))]
    const severities = [...new Set(result.entities.map((e) => e.severity.toUpperCase()))] as any[]

    let domain = ''
    let platform = 'unknown'

    if (sender?.url) {
      try {
        const url = new URL(sender.url)
        domain = url.hostname
        platform = DOMAIN_TO_PLATFORM[domain] ?? 'unknown'
      } catch {
        // ignore
      }
    }

    const event: AuditLog = {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      actionTaken: finalAction as any,
      categoryTriggered: topEntity.category,
      detectionType: topEntity.type,
      detectionTier: result.tier,
      llmPlatform: platform as any,
      domain,
      matchCount: result.entities.length,
      snippetHash,
      entityTypes,
      severities,
      extensionVersion: EXTENSION_VERSION,
      osPlatform: '',
      browser: '',
      acknowledged: false,
      latencyMs: result.processingTimeMs,
    }

    console.log('[Background] Queueing log and incrementing stat:', finalAction)
    await queueLog(event)
  } catch (err) {
    console.error('[Background] Failed to log background detection:', err)
  }
}
