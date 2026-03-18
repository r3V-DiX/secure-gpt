// ─────────────────────────────────────────────
// Background Service Worker
// Manages policy sync, log batching, extension lifecycle
// ─────────────────────────────────────────────

import { startPolicySync } from './policy-sync'
import { startLogBatcher, flushLogs } from './log-batcher'
import { stateStorage } from '@/lib/storage/storage'

// ── Extension installed / updated ─────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[SecureGPT] Extension installed')
    // Open wizard on fresh install
    await chrome.tabs.create({ url: chrome.runtime.getURL('wizard/index.html') })
  }

  if (details.reason === 'update') {
    console.log(`[SecureGPT] Updated to v${chrome.runtime.getManifest().version}`)
  }
})

// ── Start background services ─────────────────
startPolicySync()
startLogBatcher()

// ── Message handler ───────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_STATE':
      stateStorage.isActive().then((active) => sendResponse({ active }))
      return true

    case 'PAUSE_EXTENSION':
      stateStorage.pauseFor(message.minutes).then(() => {
        sendResponse({ success: true })
      })
      return true

    case 'RESUME_EXTENSION':
      stateStorage.setActive(true).then(() => {
        sendResponse({ success: true })
      })
      return true

    case 'GET_SESSION_STATS':
      stateStorage.getSessionStats().then((stats) => {
        sendResponse(stats)
      })
      return true

    case 'FLUSH_LOGS':
      flushLogs().then(() => sendResponse({ success: true }))
      return true

    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// ── Flush logs when extension is suspended ────
chrome.runtime.onSuspend.addListener(() => {
  void flushLogs()
})
