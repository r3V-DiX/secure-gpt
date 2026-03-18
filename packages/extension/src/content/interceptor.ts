// ─────────────────────────────────────────────
// Interceptor
// Hooks into LLM page submit events
// Runs detection and applies policy action
// ─────────────────────────────────────────────

import { detectPII } from '@securegpt/detection'
import { getInputElement, extractText } from './dom-utils'
import { logDetectionEvent } from './audit-logger'
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { applyMasking } from '@/features/actions/services/masking.service'
import { stateStorage } from '@/lib/storage/storage'
import type { PIIConfig } from '@securegpt/shared/types'
import { DOMAIN_TO_PLATFORM } from '@securegpt/shared/constants'

let currentPolicy: PIIConfig
let submitListeners: Array<{ element: Element; handler: EventListener }> = []

export function setupInterceptor(policy: PIIConfig): void {
  currentPolicy = policy

  // Remove existing listeners before re-setup
  teardownListeners()

  // Find all submit triggers on current LLM page
  setupSubmitListeners()

  // Watch for dynamic DOM changes (SPAs re-render input areas)
  observeDOM()
}

function setupSubmitListeners(): void {
  const platform = DOMAIN_TO_PLATFORM[window.location.hostname]
  if (!platform) return

  // Check if platform is monitored
  if (!currentPolicy.monitoredPlatforms.includes(platform)) return

  // Intercept keyboard Enter key on the input
  const handleKeyDown = async (e: Event) => {
    const keyEvent = e as KeyboardEvent
    if (keyEvent.key !== 'Enter' || keyEvent.shiftKey) return
    await handleSubmit(e)
  }

  // Intercept form submit buttons
  const handleClick = async (e: Event) => {
    await handleSubmit(e)
  }

  const inputEl = getInputElement()
  if (inputEl) {
    inputEl.addEventListener('keydown', handleKeyDown)
    submitListeners.push({ element: inputEl, handler: handleKeyDown })
  }

  // Find and intercept send button
  const sendBtn = document.querySelector(
    'button[data-testid="send-button"], button[aria-label="Send message"], button[aria-label="Submit"]'
  )
  if (sendBtn) {
    sendBtn.addEventListener('click', handleClick)
    submitListeners.push({ element: sendBtn, handler: handleClick })
  }
}

async function handleSubmit(e: Event): Promise<void> {
  // Extension paused?
  const isActive = await stateStorage.isActive()
  if (!isActive) return

  const text = extractText()
  if (!text || text.trim().length === 0) return

  // Run detection pipeline
  const result = await detectPII(text, currentPolicy)

  if (!result.hasFindings) return

  // Determine action for the highest severity category found
  const topEntity = result.entities[0]
  if (!topEntity) return

  const categoryConfig = currentPolicy.categories[topEntity.category]
  const action = categoryConfig?.action ?? 'BLOCK'

  // Apply action
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
      // Re-submit with masked text after brief delay
      setTimeout(() => resubmit(), 100)
      break
    }

    case 'WARN_ALLOW': {
      e.preventDefault()
      e.stopImmediatePropagation()
      showShieldModal(result, currentPolicy, async (proceed, acknowledged) => {
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
      // Silent — just log
      await logDetectionEvent(result, action)
      break
    }
  }
}

function setInputValue(text: string): void {
  const input = getInputElement()
  if (!input) return

  // Handle both contenteditable and textarea
  if (input.getAttribute('contenteditable')) {
    input.textContent = text
  } else {
    (input as HTMLTextAreaElement).value = text
  }

  // Dispatch input event so React state updates
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function resubmit(): void {
  const sendBtn = document.querySelector(
    'button[data-testid="send-button"], button[aria-label="Send message"]'
  ) as HTMLButtonElement | null
  if (sendBtn) {
    sendBtn.click()
  }
}

function observeDOM(): void {
  const observer = new MutationObserver(() => {
    // Re-attach listeners if DOM changed
    setupSubmitListeners()
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

function teardownListeners(): void {
  for (const { element, handler } of submitListeners) {
    element.removeEventListener('keydown', handler)
    element.removeEventListener('click', handler)
  }
  submitListeners = []
}
