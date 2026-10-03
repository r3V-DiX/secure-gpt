import { installChatGptUploadGate } from './chatgpt-upload-gate'
import { setupInterceptor, teardown } from './interceptor'
import { initSiteDetectionIndicator, removeSiteDetectionIndicator } from './site-detection-indicator'
import { getPlatformForUrl, isPlatformEnabled } from './platform-routing'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'
import { handleSubmit, isExtensionContextValid } from './submit-handler'
import type { PIIConfig, DocumentProgress } from '@securegpt/shared/types'
import type { LLMPlatform } from '@securegpt/shared/constants'

type ContentGlobal = typeof globalThis & { __securegptContentState?: { dispose: () => void } }
const contentGlobal = globalThis as ContentGlobal

try { contentGlobal.__securegptContentState?.dispose() } catch { /* stale extension context */ }
const documentGate = installChatGptUploadGate()
{

  let generation = 0
  let activePlatform: LLMPlatform | null = null
  let activePolicySignature: string | null = null
  let lastUrl = location.href
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let googleEntryPolicy: PIIConfig | null = null
  const googleHost = location.hostname === 'www.google.com' || location.hostname === 'google.com'

  const stop = (unavailable = false) => {
    if (unavailable) documentGate.invalidate()
    else documentGate.setPolicy(null)
    googleEntryPolicy = null
    if (!activePlatform) return
    teardown()
    removeSiteDetectionIndicator()
    activePlatform = null
    activePolicySignature = null
  }

  const request = <T>(type: string): Promise<T> => new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type }, (response) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
      else resolve(response as T)
    })
  })

  const reconcile = async (suppliedPolicy?: PIIConfig) => {
    const run = ++generation
    const platform = getPlatformForUrl(location.href)
    if (!platform && !googleHost) {
      stop()
      return
    }

    try {
      const [auth, state, stored] = await Promise.all([
        request<{ isLoggedIn: boolean }>('GET_AUTH_STATE'),
        request<{ active: boolean }>('GET_STATE'),
        suppliedPolicy ? Promise.resolve({ policy: suppliedPolicy }) : request<{ policy: PIIConfig | null }>('GET_POLICY'),
      ])
      if (run !== generation) return
      const policy = stored.policy ?? DEFAULT_EXTENSION_CONFIG
      if (!platform) {
        stop()
        googleEntryPolicy = auth.isLoggedIn && state.active && isPlatformEnabled(policy, 'google-ai-mode') ? policy : null
        return
      }
      googleEntryPolicy = null
      if (!auth.isLoggedIn || !state.active || !isPlatformEnabled(policy, platform)) {
        stop()
        return
      }
      const policySignature = JSON.stringify(policy)
      if (activePlatform === platform && activePolicySignature === policySignature) return
      setupInterceptor(policy)
      documentGate.setPolicy(policy)
      initSiteDetectionIndicator(policy)
      activePlatform = platform
      activePolicySignature = policySignature
      if (retryTimer) clearTimeout(retryTimer)
    } catch {
      if (run !== generation) return
      stop(true)
      googleEntryPolicy = null
      if (retryTimer) clearTimeout(retryTimer)
      retryTimer = setTimeout(() => void reconcile(), 2000)
    }
  }

  const handleGoogleAiEntry = (event: MouseEvent) => {
    if (!event.isTrusted || !googleEntryPolicy || !isExtensionContextValid()) return
    const target = event.target as Element | null
    const control = target?.closest<HTMLElement>('button[role="link"], a')
    if (control?.innerText?.trim() !== 'AI Mode') return
    const search = document.querySelector<HTMLTextAreaElement>('textarea[name="q"]')
    if (!search?.value.trim()) return

    event.preventDefault()
    event.stopImmediatePropagation()
    const policy = googleEntryPolicy
    void handleSubmit(search, {
      getCurrentPolicy: () => policy,
      getPreAllowedText: () => '',
      ocrCache: new Map(),
      getPendingCount: () => 0,
      isProtectionActive: () => googleEntryPolicy !== null,
      entryPlatform: 'google-ai-mode',
      resubmit: () => control.click(),
    })
  }

  // This listener must exist even while logged out, paused, or on ordinary Search.
  const messageListener = (message: { type: string; policy?: PIIConfig }, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.type === 'DOCUMENT_PROGRESS') {
      documentGate.progress(message as DocumentProgress)
      return
    }
    if (message.type === 'SECUREGPT_PING') {
      sendResponse({ ready: isExtensionContextValid() })
      return
    }
    if (message.type === 'AUTH_LOST' || message.type === 'EXTENSION_PAUSED') {
      ++generation
      stop()
      return
    }
    if (message.type === 'AUTH_SUCCESS' || message.type === 'EXTENSION_RESUMED' || message.type === 'POLICY_UPDATED') {
      void reconcile(message.type === 'POLICY_UPDATED' ? message.policy : undefined)
    }
  }
  chrome.runtime.onMessage.addListener(messageListener)

  const storageListener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && ['auth', 'policy', 'isActive', 'pausedUntil'].some(key => key in changes)) {
      void reconcile()
    }
  }
  chrome.storage.onChanged.addListener(storageListener)

  const checkLocation = () => {
    if (lastUrl === location.href) return
    lastUrl = location.href
    void reconcile()
  }
  window.addEventListener('popstate', checkLocation)
  window.addEventListener('hashchange', checkLocation)
  const navigation = (window as Window & { navigation?: EventTarget }).navigation
  navigation?.addEventListener('currententrychange', checkLocation)
  let googlePoll: ReturnType<typeof setInterval> | null = null
  if (googleHost) {
    googlePoll = setInterval(checkLocation, 500)
    window.addEventListener('click', handleGoogleAiEntry, true)
  }
  const recoveryPoll = setInterval(() => void reconcile(), 30_000)

  contentGlobal.__securegptContentState = { dispose: () => {
    documentGate.dispose()
    ++generation
    stop()
    if (retryTimer) clearTimeout(retryTimer)
    if (googlePoll) clearInterval(googlePoll)
    clearInterval(recoveryPoll)
    window.removeEventListener('popstate', checkLocation)
    window.removeEventListener('hashchange', checkLocation)
    navigation?.removeEventListener('currententrychange', checkLocation)
    if (googleHost) window.removeEventListener('click', handleGoogleAiEntry, true)
    chrome.runtime.onMessage.removeListener(messageListener)
    chrome.storage.onChanged.removeListener?.(storageListener)
  } }

  void reconcile()
}
