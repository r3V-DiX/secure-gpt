// packages/extension/src/background/index.ts
// Background Service Worker
// Manages policy sync, log batching, OAuth tab watching

import { startPolicySync, forcePolicySync } from './policy-sync'
import { activateOpenTabs, activateTab } from './open-tab-activation'
import { startLogBatcher, flushLogs, queueLog, scheduleRecoveryFlush } from './log-batcher'
import { handleDetectPII, handleDetectPIIImage, handleDetectPIIPDF, handleDetectPIIOffice, handleRedactPDF, handleRedactOffice } from './detection-handler'
import { stateStorage, authStorage, policyStorage, localStorageExt } from '@/lib/storage/storage'
import { fetchCurrentUser } from '@/features/auth/services/auth.service'
import type { AuditLog } from '@securegpt/shared/types'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'
import { getPlatformForUrl, isPlatformEnabled } from '../content/platform-routing'

const emptyFileResult = { hasFindings: false, entities: [], tier: 'ocr', processingTimeMs: 0, inputLength: 0 }

async function canDetect(sender: chrome.runtime.MessageSender, entryPlatform?: string): Promise<boolean> {
  if (!sender.url) return false
  const isProtectedNewTabEntry = entryPlatform === 'google-ai-mode'
    && sender.id === chrome.runtime.id
    && sender.url === chrome.runtime.getURL('src/newtab/index.html')
  if (!sender.tab && !isProtectedNewTabEntry) return false
  const url = new URL(sender.url)
  const isGoogleSearchEntry = entryPlatform === 'google-ai-mode'
    && (url.hostname === 'google.com' || url.hostname === 'www.google.com')
    && (url.pathname === '/' || url.pathname === '/search')
  const platform = isProtectedNewTabEntry || isGoogleSearchEntry ? 'google-ai-mode' : getPlatformForUrl(sender.url)
  if (!platform) return false
  const [policy, active, loggedIn] = await Promise.all([
    policyStorage.getPolicy(), stateStorage.isActive(), authStorage.isLoggedIn(),
  ])
  return active && loggedIn && isPlatformEnabled(policy ?? DEFAULT_EXTENSION_CONFIG, platform)
}

async function inspectFileIfEnabled<T>(config: { enableDocumentScanning?: boolean }, work: () => Promise<T>): Promise<T | typeof emptyFileResult> {
  const policy = await policyStorage.getPolicy()
  if (policy?.enableDocumentScanning === false || config?.enableDocumentScanning === false) return emptyFileResult
  const result = await work()
  const latest = await policyStorage.getPolicy()
  return latest?.enableDocumentScanning === false ? emptyFileResult : result
}

async function recoverOpenTabs(): Promise<void> {
  try { await activateOpenTabs() } catch (error) { console.warn('[Background] Initial tab recovery failed', error) }
  // A tab may still be loading while Chrome registers the new extension.
  await new Promise(resolve => setTimeout(resolve, 1000))
  try { await activateOpenTabs() } catch (error) { console.warn('[Background] Tab recovery retry failed', error) }
}

chrome.runtime.onInstalled.addListener(() => { void recoverOpenTabs() })
chrome.runtime.onStartup.addListener(() => { void recoverOpenTabs() })
chrome.tabs.onActivated.addListener(({ tabId }) => { void activateTab(tabId) })

// ── Watch for OAuth tab completion ────────────
// When user completes Google login, the tab redirects to /callback.
// We detect this, fetch the user, store it, notify the popup.
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) void activateTab(_tabId, tab.url)
  const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL ?? 'https://securegpt.rkavach.com'
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
      void canDetect(sender, message.entryPlatform).then(allowed => allowed
        ? handleDetectPII(message.text, message.config, sender)
        : { ...emptyFileResult, tier: 'regex' as const }
      ).then(sendResponse)
      return true

    case 'DETECT_PII_IMAGE':
      void canDetect(sender).then(allowed => allowed
        ? inspectFileIfEnabled(message.config, () => handleDetectPIIImage(message.imgUrl, message.config, sender))
        : emptyFileResult
      ).then(sendResponse)
      return true

    case 'DETECT_PII_PDF':
      void canDetect(sender).then(allowed => allowed
        ? inspectFileIfEnabled(message.config, () => handleDetectPIIPDF(message.pdfData, message.config, sender))
        : emptyFileResult
      ).then(sendResponse)
      return true

    case 'DETECT_PII_OFFICE':
      void canDetect(sender).then(allowed => allowed
        ? inspectFileIfEnabled(message.config, () => handleDetectPIIOffice(message.pdfData, message.config, sender, message.fileName))
        : emptyFileResult
      ).then(sendResponse)
      return true

    case 'REDACT_OFFICE':
      void handleRedactOffice(message.pdfData, message.entities, message.fileName).then(sendResponse)
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
