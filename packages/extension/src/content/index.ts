// ─────────────────────────────────────────────
// Content Script — Entry Point
// Injected into every LLM page
// ─────────────────────────────────────────────

import { setupInterceptor, teardown } from './interceptor'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'
import { PLATFORM_DOMAINS } from '@securegpt/shared/constants'

const MONITORED_HOSTNAMES = new Set(
  Object.values(PLATFORM_DOMAINS).flatMap((d) => (Array.isArray(d) ? d : [d]))
)

let messageListenerRegistered = false

async function init() {
  // Guard: only activate on known LLM platforms, not every *.google.com page
  if (!MONITORED_HOSTNAMES.has(window.location.hostname)) {
    console.log('[SecureGPT] Not an LLM platform — skipping interceptor')
    return
  }

  console.log('[SecureGPT] Initializing content script...')

  // ── Auth check — do NOT run interceptor if not logged in ──
  const isLoggedIn = await new Promise<boolean>((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, (res) => {
      if (chrome.runtime.lastError) {
        resolve(false)
      } else {
        resolve(res?.isLoggedIn ?? false)
      }
    })
  })

  if (!isLoggedIn) {
    console.log('[SecureGPT] Not logged in — interceptor not started')
    return
  }

  // Check if extension is active
  const isActive = await new Promise<boolean>((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => resolve(res?.active ?? true))
  })
  console.log('[SecureGPT] Extension active:', isActive)
  if (!isActive) return

  // Load policy — fall back to defaults
  const policy = await new Promise<any>((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_POLICY' }, (res) => resolve(res?.policy ?? DEFAULT_EXTENSION_CONFIG))
  })

  // Start intercepting submit events
  setupInterceptor(policy)

  // Register the message listener exactly once — never on re-init
  if (!messageListenerRegistered) {
    messageListenerRegistered = true
    chrome.runtime.onMessage.addListener(handleBackgroundMessage)
  }
}

function handleBackgroundMessage(message: { type: string; policy?: any }): void {
  if (message.type === 'AUTH_SUCCESS') {
    // User just logged in — start the interceptor on this already-open tab
    void init()
  }
  if (message.type === 'POLICY_UPDATED' && message.policy) {
    setupInterceptor(message.policy)
  }
  if (message.type === 'EXTENSION_PAUSED') {
    teardown()
  }
  if (message.type === 'EXTENSION_RESUMED') {
    void init()
  }
  if (message.type === 'AUTH_LOST') {
    teardown()
  }
}

void init()
