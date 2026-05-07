// ─────────────────────────────────────────────
// Content Script — Entry Point
// Injected into every LLM page
// ─────────────────────────────────────────────

import { setupInterceptor, teardown } from './interceptor'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'

async function init() {
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

  // Listen for policy updates from background
  chrome.runtime.onMessage.addListener((message) => {
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
      // User logged out — stop intercepting
      teardown()
    }
  })
}

void init()