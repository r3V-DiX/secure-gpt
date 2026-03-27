// packages/extension/src/background/detection-handler.ts
import type { PIIConfig, DetectionResult, AuditLog } from '@securegpt/shared/types'
import { v4 as uuidv4 } from 'uuid'
import { EXTENSION_VERSION } from '@/config/defaults.config'
import { queueLog } from './log-batcher'
import { DOMAIN_TO_PLATFORM } from '@securegpt/shared/constants'
import { stateStorage } from '@/lib/storage/storage'

let creating: Promise<void> | null = null

async function setupOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT]
  })
  if (contexts.length > 0) return

  if (creating) {
    await creating
    return
  }

  creating = chrome.offscreen.createDocument({
    url: 'src/offscreen/offscreen.html', 
    reasons: [chrome.offscreen.Reason.WORKERS, chrome.offscreen.Reason.LOCAL_STORAGE],
    justification: 'Running PII detection in WASM/Worker context to bypass Service Worker CSP restrictions'
  })
  await creating
  creating = null
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
