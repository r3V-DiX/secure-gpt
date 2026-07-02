// packages/extension/src/background/index.ts
// Background Service Worker
// Manages policy sync, log batching, OAuth tab watching

import { startPolicySync, forcePolicySync } from './policy-sync'
import { startLogBatcher, flushLogs, queueLog, scheduleRecoveryFlush } from './log-batcher'
import { handleDetectPII, handleDetectPIIImage, handleDetectPIIPDF, handleRedactPDF } from './detection-handler'
import { stateStorage, authStorage, policyStorage, localStorageExt } from '@/lib/storage/storage'
import { fetchCurrentUser } from '@/features/auth/services/auth.service'
import type { AuditLog } from '@securegpt/shared/types'

// ── Watch for OAuth tab completion ────────────
// When user completes Google login, the tab redirects to /callback.
// We detect this, fetch the user, store it, notify the popup.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL ?? 'http://localhost:3000'
  const callbackUrl = `${DASHBOARD_URL}/callback`

  if (
    changeInfo.status === 'complete' &&
    tab.url?.startsWith(callbackUrl)
  ) {
    console.log('[Background] OAuth callback detected — fetching user...')
    try {
      const user = await fetchCurrentUser()
      if (user) {
        console.log('[Background] Auth success — user:', user.email)

        // Notify popup and content scripts
        chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', user }).catch(() => { })

        // Notify all content scripts to re-init interceptor
        const tabs = await chrome.tabs.query({})
        for (const t of tabs) {
          if (t.id) {
            chrome.tabs.sendMessage(t.id, { type: 'AUTH_SUCCESS' }).catch(() => { })
          }
        }
      }
    } catch (err) {
      console.error('[Background] Failed to fetch user after OAuth:', err)
    }
  }
})

// ── Message handler ───────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ignore messages meant for the offscreen document
  if (message.target === 'offscreen') return false
  if (message.action && message.action.startsWith('OFFSCREEN_')) return false

  switch (message.type) {
    case 'GET_AUTH_STATE':
      void authStorage.isLoggedIn().then((isLoggedIn) => sendResponse({ isLoggedIn }))
      return true

    case 'DETECT_PII':
      void handleDetectPII(message.text, message.config, sender).then(sendResponse)
      return true

    case 'DETECT_PII_IMAGE':
      void handleDetectPIIImage(message.imgUrl, message.config, sender).then(sendResponse)
      return true

    case 'DETECT_PII_PDF':
      void handleDetectPIIPDF(message.pdfData, message.config, sender).then(sendResponse)
      return true

    case 'REDACT_PDF':
      void handleRedactPDF(message.pdfData, message.entities, message.manualRegions).then(sendResponse)
      return true

    case 'AUTH_LOST':
      void authStorage.clearAuth().then(() => sendResponse({ success: true }))
      return true

    case 'QUEUE_LOG':
      void queueLog(message.event as AuditLog).then(() => sendResponse({ success: true }))
      return true

    case 'GET_STATE':
      void stateStorage.isActive().then((active) => sendResponse({ active }))
      return true

    case 'GET_POLICY':
      void policyStorage.getPolicy().then((policy) => sendResponse({ policy }))
      return true

    case 'SYNC_POLICY':
      void forcePolicySync().then(async () => {
        const version = await policyStorage.getPolicyVersion()
        const lastSyncedAt = await localStorageExt.get<string>('policyLastSyncedAt')
        sendResponse({ success: true, version, lastSyncedAt })
      }).catch((err) => {
        sendResponse({ success: false, error: String(err) })
      })
      return true

    case 'INCREMENT_STAT':
      void stateStorage.incrementStat(message.action).then(() => sendResponse({ success: true }))
      return true

    case 'PAUSE_EXTENSION':
      void stateStorage.pauseFor(message.minutes).then(() => sendResponse({ success: true }))
      return true

    case 'RESUME_EXTENSION':
      void stateStorage.setActive(true).then(() => sendResponse({ success: true }))
      return true

    case 'GET_SESSION_STATS':
      void stateStorage.getSessionStats().then((stats) => sendResponse(stats))
      return true

    case 'FLUSH_LOGS':
      void flushLogs().then(() => sendResponse({ success: true }))
      return true

    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// ── On suspend: schedule recovery alarm so SW wakes ASAP to drain the queue ──
// The network request in flushLogs() never completes before the SW is killed,
// so we just persist the queue (already done by queueLog) and let the alarm
// wake us back up to send it.
chrome.runtime.onSuspend.addListener(() => {
  scheduleRecoveryFlush()
})

// ── Initialize background tasks ────────────────
void startLogBatcher()
void startPolicySync()