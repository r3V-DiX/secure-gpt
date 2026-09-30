// ─────────────────────────────────────────────
// Audit Logger
// Builds AuditLog events and queues them via background worker.
// NEVER logs raw text — only SHA-256 hash of matched value.
//
// NOTE: userId / orgId are intentionally NOT included in the event.
// Backend reads those from the session cookie server-side.
// ─────────────────────────────────────────────

import { authStorage } from '@/lib/storage/storage'
import { getPlatformForUrl } from './platform-routing'
import { EXTENSION_VERSION } from '@/config/defaults.config'
import type { DetectionResult } from '@securegpt/shared/types'
import type { PolicyAction, LLMPlatform } from '@securegpt/shared/constants'
import type { AuditLog } from '@securegpt/shared/types'
import { v4 as uuidv4 } from 'uuid'

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Guard: check if the extension runtime is still valid before
// making any chrome.storage / chrome.runtime calls.
function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id
  } catch {
    return false
  }
}

export async function logDetectionEvent(
  result: DetectionResult,
  action: PolicyAction,
  topEntity: any,
  acknowledged = false,
  platformOverride?: LLMPlatform
): Promise<void> {
  console.log('[SecureGPT] logDetectionEvent called with result:', result.hasFindings, 'action:', action)
  // Bail out silently if extension was reloaded and context is gone
  if (!isExtensionContextValid()) {
    console.warn('[SecureGPT] Skipping log — extension context invalidated')
    return
  }

  try {
    // Only queue if logged in — background will retry if session expires mid-queue
    const isLoggedIn = await authStorage.isLoggedIn()
    console.log('[SecureGPT] isLoggedIn for logging:', isLoggedIn)
    if (!isLoggedIn) {
      console.warn('[SecureGPT] Not logged in, skipping log event queueing')
      return
    }

    if (!topEntity) {
      console.warn('[SecureGPT] No topEntity for logDetectionEvent')
      return
    }

    const platform = platformOverride ?? getPlatformForUrl(window.location.href) ?? 'unknown'

    // Hash the matched value — NEVER log raw text
    const snippetHash = await sha256(topEntity.value)

    // Collect all entity types and severities across detected entities
    const entityTypes = [...new Set(result.entities.map((e) => e.type))]
    const severities = [...new Set(result.entities.map((e) => e.severity.toUpperCase()))] as any[]

    const event: AuditLog = {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      actionTaken: action as any,
      categoryTriggered: topEntity.category,
      detectionType: topEntity.type,
      detectionTier: result.tier,
      llmPlatform: platform as any,
      domain: platform === 'google-ai-mode' && window.location.protocol === 'chrome-extension:'
        ? 'www.google.com' : window.location.hostname,
      matchCount: result.entities.length,
      snippetHash,
      entityTypes,
      severities,
      extensionVersion: EXTENSION_VERSION,
      osPlatform: navigator.platform,
      browser: getBrowserName(),
      acknowledged,
      latencyMs: result.processingTimeMs,
    }

    console.log('[SecureGPT] Sending QUEUE_LOG message to background:', event.eventId)
    // Send to background worker for batching and API submission
    chrome.runtime.sendMessage({ type: 'QUEUE_LOG', event }, (_response) => {
      if (chrome.runtime.lastError) {
        console.error('[SecureGPT] Failed to send QUEUE_LOG message:', chrome.runtime.lastError)
      } else {
        console.log('[SecureGPT] QUEUE_LOG message acknowledged by background')
      }
    })
  } catch (err) {
    const message = (err as Error)?.message ?? ''
    if (message.includes('Extension context invalidated')) {
      console.warn('[SecureGPT] Skipping log — extension context lost mid-flight')
    } else {
      console.error('[SecureGPT] logDetectionEvent error:', err)
    }
  }
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  return 'Unknown'
}
