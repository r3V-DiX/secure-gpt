// packages/extension/src/background/index.ts
// Background Service Worker
// Manages policy sync, log batching, OAuth tab watching

import { startPolicySync } from './policy-sync'
import { startLogBatcher, flushLogs, queueLog } from './log-batcher'
import { handleDetectPII } from './detection-handler'
import { stateStorage, authStorage, policyStorage } from '@/lib/storage/storage'
import { fetchCurrentUser } from '@/features/auth/services/auth.service'
import type { AuditLog } from '@securegpt/shared/types'

// ... (tab watcher code)

// ── Message handler ───────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'DETECT_PII':
      handleDetectPII(message.text, message.config, sender).then(sendResponse)
      return true

    case 'AUTH_LOST':
      authStorage.clearAuth().then(() => sendResponse({ success: true }))
      return true

    case 'QUEUE_LOG':
      queueLog(message.event as AuditLog).then(() => sendResponse({ success: true }))
      return true

    case 'GET_STATE':
      stateStorage.isActive().then((active) => sendResponse({ active }))
      return true

    case 'GET_POLICY':
      policyStorage.getPolicy().then((policy) => sendResponse({ policy }))
      return true

    case 'INCREMENT_STAT':
      stateStorage.incrementStat(message.action).then(() => sendResponse({ success: true }))
      return true

    case 'PAUSE_EXTENSION':
      stateStorage.pauseFor(message.minutes).then(() => sendResponse({ success: true }))
      return true

    case 'RESUME_EXTENSION':
      stateStorage.setActive(true).then(() => sendResponse({ success: true }))
      return true

    case 'GET_SESSION_STATS':
      stateStorage.getSessionStats().then((stats) => sendResponse(stats))
      return true

    case 'FLUSH_LOGS':
      flushLogs().then(() => sendResponse({ success: true }))
      return true

    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// ── Flush logs on suspend ─────────────────────
chrome.runtime.onSuspend.addListener(() => {
  void flushLogs()
})

// ── Initialize background tasks ────────────────
startLogBatcher()
startPolicySync()