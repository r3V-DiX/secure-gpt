// packages/extension/src/background/detection-handler.ts
import type { PIIConfig, DetectionResult, AuditLog } from '@securegpt/shared/types'
import { v4 as uuidv4 } from 'uuid'
import { EXTENSION_VERSION } from '@/config/defaults.config'
import { queueLog } from './log-batcher'
import { DOMAIN_TO_PLATFORM } from '@securegpt/shared/constants'


let creating: Promise<void> | null = null

async function setupOffscreen() {
  const offscreenUrl = chrome.runtime.getURL('src/offscreen/offscreen.html')

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
  sender?: chrome.runtime.MessageSender
): Promise<DetectionResult> {
  try {
    console.log('[Background] Delegating detection to Offscreen Document...')
    await setupOffscreen()

    const result = await new Promise<DetectionResult>((resolve) => {
      chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'DETECT_PII',
        text,
        config
      }, (res) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Offscreen detection error:', chrome.runtime.lastError)
          resolve({
            hasFindings: false,
            entities: [],
            tier: 'regex',
            processingTimeMs: 0,
            inputLength: text.length
          })
        } else {
          resolve(res)
        }
      })
    })

    console.log('[Background] Detection complete, findings:', result.hasFindings)

    if (result.hasFindings) {
      void logBackgroundDetection(result, text, config, sender)
    }

    return result
  } catch (err) {
    console.error('[Background] Failed to setup offscreen or detect PII:', err)
    return {
      hasFindings: false,
      entities: [],
      tier: 'regex',
      processingTimeMs: 0,
      inputLength: text.length
    }
  }
}

/**
 * Proxies image OCR to the offscreen document using the reference ping+forward pattern.
 * Returns entities enriched with bounding box data for canvas redaction.
 */
export async function handleDetectPIIImage(
  imgUrl: string,
  config: PIIConfig,
  sender?: chrome.runtime.MessageSender
): Promise<DetectionResult> {
  const empty: DetectionResult = { hasFindings: false, entities: [], tier: 'ocr', processingTimeMs: 0, inputLength: 0 }

  try {
    console.log('[Background] Proxying OCR request to offscreen document...')
    await setupOffscreen()

    // Poll until offscreen doc is ready (mirrors reference implementation)
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

    if (result.hasFindings) {
      void logBackgroundDetection(result, imgUrl, config, sender)
    }

    return result
  } catch (err) {
    console.error('[Background] Failed to proxy image OCR:', err)
    return empty
  }
}

async function logBackgroundDetection(
  result: DetectionResult, 
  _text: string, 
  config: PIIConfig,
  sender?: chrome.runtime.MessageSender
) {
  try {
    const topEntity = result.entities[0]
    if (!topEntity) return

    const action = config.categories[topEntity.category]?.action ?? 'ALLOW'

    // Hash the matched value — NEVER log raw text
    const snippetHash = await sha256(topEntity.value)

    // Collect all entity types and severities across detected entities
    const entityTypes = [...new Set(result.entities.map((e) => e.type))]
    const severities = [...new Set(result.entities.map((e) => e.severity.toUpperCase()))]

    let domain = ''
    let platform = 'unknown'

    if (sender?.url) {
      try {
        const url = new URL(sender.url)
        domain = url.hostname
        platform = DOMAIN_TO_PLATFORM[domain] ?? 'unknown'
      } catch {
        // Ignore URL parse errors
      }
    }

    const event: AuditLog = {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      actionTaken: action,
      categoryTriggered: topEntity.category,
      detectionType: topEntity.type,
      detectionTier: result.tier,
      llmPlatform: platform as any,
      domain: domain,
      matchCount: result.entities.length,
      snippetHash,
      entityTypes,
      severities,
      extensionVersion: EXTENSION_VERSION,
      osPlatform: '', // Optional
      browser: '',    // Optional
      acknowledged: false,
      latencyMs: result.processingTimeMs,
    }

    console.log('[Background] Queueing log and incrementing stat:', action)
    
    // 1. Queue the audit log
    await queueLog(event)

  } catch (err) {
    console.error('[Background] Failed to log background detection:', err)
  }
}
