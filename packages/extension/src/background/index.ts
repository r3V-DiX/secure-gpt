// packages/extension/src/background/index.ts
// Background Service Worker
// Manages policy sync, log batching, OAuth tab watching

import { startPolicySync } from './policy-sync'
import { startLogBatcher, flushLogs, queueLog } from './log-batcher'
import { stateStorage, authStorage } from '@/lib/storage/storage'
import { fetchCurrentUser } from '@/features/auth/services/auth.service'
import type { AuditLog } from '@securegpt/shared/types'

// Dashboard /callback URL signals OAuth is complete
const OAUTH_CALLBACK_PATTERNS = ['/callback', '/auth/callback']

// ── Start background services ─────────────────
startPolicySync()
startLogBatcher()

// ── OAuth callback tab watcher ────────────────
// After Google OAuth, dashboard /callback page runs refresh()
// then redirects to /dashboard automatically.
// We just fetch the user here and notify the popup — no tab closing.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  if (!tab.url) return

  const isCallback = OAUTH_CALLBACK_PATTERNS.some((p) => tab.url!.includes(p))
  if (!isCallback) return

  console.log('[SecureGPT] OAuth callback detected — fetching user...')

  try {
    const user = await fetchCurrentUser()
    if (user) {
      console.log('[SecureGPT] Login successful:', user.email)
      // Notify popup so it updates its state
      chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', user }).catch(() => {})
    } else {
      console.warn('[SecureGPT] fetchCurrentUser returned null after OAuth')
    }
  } catch (err) {
    console.warn('[SecureGPT] Failed to fetch user after OAuth:', err)
  }
})

// ── Message handler ───────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {

    case 'AUTH_LOST':
      authStorage.clearAuth().then(() => sendResponse({ success: true }))
      return true

    case 'QUEUE_LOG':
      queueLog(message.event as AuditLog).then(() => sendResponse({ success: true }))
      return true

    case 'GET_STATE':
      stateStorage.isActive().then((active) => sendResponse({ active }))
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