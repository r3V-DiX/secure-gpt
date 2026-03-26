// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit events
// Fixed: retry logic for dynamic DOM, proper listener dedup, no duplicate handlers

import { detectPIIDemo as detectPII } from '@/lib/detection/demo-detection'
import { getInputElement, extractText } from './dom-utils'
import { logDetectionEvent } from './audit-logger'
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { applyMasking } from '@/features/actions/services/masking.service'
import { stateStorage } from '@/lib/storage/storage'
import type { PIIConfig } from '@securegpt/shared/types'
import { DOMAIN_TO_PLATFORM } from '@securegpt/shared/constants'

let currentPolicy: PIIConfig
let domObserver: MutationObserver | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null

// Track attached elements to avoid duplicate listeners
const attachedElements = new WeakSet<Element>()

export function setupInterceptor(policy: PIIConfig): void {
  currentPolicy = policy
  teardown()
  tryAttachListeners()
  observeDOM()
}

// Try to attach listeners — if input not found yet, retry after delay
function tryAttachListeners(): void {
  const attached = attachListeners()
  if (!attached) {
    // Input not in DOM yet — retry every 500ms up to 10 times
    let attempts = 0
    const retry = () => {
      if (attempts >= 10) return
      attempts++
      if (attachListeners()) return // success
      retryTimer = setTimeout(retry, 500)
    }
    retryTimer = setTimeout(retry, 500)
  }
}

// Returns true if successfully attached to input
function attachListeners(): boolean {
  const platform = DOMAIN_TO_PLATFORM[window.location.hostname]
  if (!platform) return true // not a monitored platform — don't retry

  if (!currentPolicy.monitoredPlatforms.includes(platform)) return true

  const inputEl = getInputElement()
  const sendBtn = document.querySelector<HTMLElement>(
    'button[data-testid="send-button"], button[aria-label="Send message"], button[aria-label="Submit"]'
  )

  let attached = false

  if (inputEl && !attachedElements.has(inputEl)) {
    const handleKeyDown = async (e: Event) => {
      const keyEvent = e as KeyboardEvent
      if (keyEvent.key !== 'Enter' || keyEvent.shiftKey) return
      await handleSubmit(e)
    }
    inputEl.addEventListener('keydown', handleKeyDown)
    attachedElements.add(inputEl)
    attached = true
    console.log('[SecureGPT] Attached keydown listener to input')
  }

  if (sendBtn && !attachedElements.has(sendBtn)) {
    const handleClick = async (e: Event) => {
      await handleSubmit(e)
    }
    sendBtn.addEventListener('click', handleClick)
    attachedElements.add(sendBtn)
    attached = true
    console.log('[SecureGPT] Attached click listener to send button')
  }

  return attached
}

async function handleSubmit(e: Event): Promise<void> {
  const isActive = await stateStorage.isActive()
  if (!isActive) return

  const text = extractText()
  if (!text || text.trim().length === 0) return

  const result = await detectPII(text, currentPolicy)
  if (!result.hasFindings) return

  const topEntity = result.entities[0]
  if (!topEntity) return

  const categoryConfig = currentPolicy.categories[topEntity.category]
  const action = categoryConfig?.action ?? 'BLOCK'

  switch (action) {
    case 'BLOCK': {
      e.preventDefault()
      e.stopImmediatePropagation()
      showBanner('block', topEntity.category, result.entities.length)
      await logDetectionEvent(result, action)
      await stateStorage.incrementStat('block')
      break
    }

    case 'MASK': {
      e.preventDefault()
      e.stopImmediatePropagation()
      const maskedText = applyMasking(text, result.entities)
      setInputValue(maskedText)
      showBanner('mask', topEntity.category, result.entities.length)
      await logDetectionEvent(result, action)
      await stateStorage.incrementStat('mask')
      setTimeout(() => resubmit(), 100)
      break
    }

    case 'WARN_ALLOW': {
      e.preventDefault()
      e.stopImmediatePropagation()
      showShieldModal(result, currentPolicy, text, async (proceed, _masked, acknowledged) => {
        if (proceed) {
          await logDetectionEvent(result, action, acknowledged)
          resubmit()
        }
        removeBanner()
      })
      await stateStorage.incrementStat('warn')
      break
    }

    case 'ALLOW': {
      await logDetectionEvent(result, action)
      break
    }
  }
}

function setInputValue(text: string): void {
  const input = getInputElement()
  if (!input) return

  if (input.getAttribute('contenteditable')) {
    input.textContent = text
  } else {
    (input as HTMLTextAreaElement).value = text
  }

  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function resubmit(): void {
  const sendBtn = document.querySelector<HTMLButtonElement>(
    'button[data-testid="send-button"], button[aria-label="Send message"]'
  )
  sendBtn?.click()
}

// Watch for new elements added to DOM — re-try attaching when DOM changes
function observeDOM(): void {
  domObserver = new MutationObserver(() => {
    attachListeners()
  })
  domObserver.observe(document.body, { childList: true, subtree: true })
}

function teardown(): void {
  if (domObserver) {
    domObserver.disconnect()
    domObserver = null
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  // Remove banners
  document.querySelectorAll('[data-securegpt]').forEach((el) => el.remove())
}