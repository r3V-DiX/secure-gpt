// ─────────────────────────────────────────────
// Audit Logger
// Builds AuditLog events and queues them
// NEVER logs raw text — only hashes + metadata
// ─────────────────────────────────────────────

import { authStorage } from '@/lib/storage/storage'
import { DOMAIN_TO_PLATFORM } from '@securegpt/shared/constants'
import { EXTENSION_VERSION } from '@/config/defaults.config'
import type { DetectionResult } from '@securegpt/shared/types'
import type { PolicyAction } from '@securegpt/shared/constants'
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

export async function logDetectionEvent(
  result: DetectionResult,
  action: PolicyAction,
  acknowledged = false
): Promise<void> {
  const auth = await authStorage.getAuth()
  if (!auth) return

  const topEntity = result.entities[0]
  if (!topEntity) return

  const platform = DOMAIN_TO_PLATFORM[window.location.hostname] ?? 'unknown'

  // Hash the matched snippet — NEVER the full text
  const snippetHash = await sha256(topEntity.value)

  const event: AuditLog = {
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    userId: auth.user.id,
    userEmail: auth.user.email,
    orgId: auth.user.orgId,
    department: auth.user.department,
    actionTaken: action,
    categoryTriggered: topEntity.category,
    detectionType: topEntity.type,
    detectionTier: result.tier,
    llmPlatform: platform,
    matchCount: result.entities.length,
    snippetHash,
    extensionVersion: EXTENSION_VERSION,
    osPlatform: navigator.platform,
    browser: getBrowserName(),
    acknowledged,
  }

  // Send to background worker for batching
  chrome.runtime.sendMessage({ type: 'QUEUE_LOG', event })
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  return 'Unknown'
}
