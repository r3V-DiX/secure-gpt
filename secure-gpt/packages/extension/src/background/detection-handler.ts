// packages/extension/src/background/detection-handler.ts
import type { PIIConfig, DetectionResult, AuditLog } from '@securegpt/shared/types'
import { detectPII } from '@securegpt/detection'
import { v4 as uuidv4 } from 'uuid'
import { EXTENSION_VERSION } from '@/config/defaults.config'
import { queueLog } from './log-batcher'
import { DOMAIN_TO_PLATFORM, POLICY_ACTION_PRIORITY, type PolicyAction } from '@securegpt/shared/constants'
import { ensureOffscreenReady } from './offscreen-proxy'
export { handleRedactPDF, handleRedactOffice } from './redaction-handler'

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
      inputLength: text.length,
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
    const isReady = await ensureOffscreenReady()
    if (!isReady) {
      console.error('[Background] Offscreen document failed to respond to PING after retries.')
      return empty
    }

    const response: { ok: boolean; result?: DetectionResult; error?: string } =
      await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_RUN_OCR',
        data: { imageUrl: imgUrl, config },
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
    const isReady = await ensureOffscreenReady()
    if (!isReady) {
      console.error('[Background] Offscreen document failed to respond to PING after retries.')
      return empty
    }

    const response: { ok: boolean; result?: any; error?: string } =
      await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_RUN_PDF',
        data: { pdfData },
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

export async function handleDetectPIIOffice(
  fileData: string,
  config: PIIConfig,
  sender?: chrome.runtime.MessageSender,
  fileName?: string
): Promise<DetectionResult> {
  const empty: DetectionResult = { hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: 0 }

  try {
    console.log('[Background] Proxying office-doc extract to offscreen document...')
    const isReady = await ensureOffscreenReady()
    if (!isReady) {
      console.error('[Background] Offscreen document failed to respond to PING after retries.')
      return empty
    }

    const response: { ok: boolean; text?: string; error?: string } =
      await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_RUN_OFFICE',
        data: { fileData, fileName },
      })

    if (!response?.ok || !response.text) {
      console.warn('[Background] Office extraction returned no text:', response?.error)
      return empty
    }

    return await handleDetectPII(response.text, config, sender)
  } catch (err) {
    console.error('[Background] Failed to proxy office detection:', err)
    return empty
  }
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
    let finalAction: PolicyAction = 'ALLOW'
    let topEntity = result.entities[0]!

    for (const entity of result.entities) {
      const action = (config.categories[entity.category]?.action ?? 'ALLOW') as PolicyAction
      const priority = POLICY_ACTION_PRIORITY[action] ?? 0
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
