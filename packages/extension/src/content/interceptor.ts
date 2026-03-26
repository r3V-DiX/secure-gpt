// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit events
// Refactored for SYNCHRONOUS blocking to prevent race conditions

import { detectPIIDemo as detectPII } from '@/lib/detection/demo-detection'
import { findEditableRoot, findMainEditor, extractText } from './dom-utils'
import { logDetectionEvent } from './audit-logger'
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { applyMasking } from '@/features/actions/services/masking.service'
import { stateStorage } from '@/lib/storage/storage'
import type { PIIConfig } from '@securegpt/shared/types'
import { DOMAIN_TO_PLATFORM } from '@securegpt/shared/constants'

let currentPolicy: PIIConfig
let isRunning = false

// Bypass set for resubmission
const bypassSet = new WeakSet<Element>()

export function setupInterceptor(policy: PIIConfig): void {
  currentPolicy = policy
  teardown()
  attachGlobalListeners()
}

function attachGlobalListeners(): void {
  document.addEventListener('keydown', handleGlobalKeyDown, true)
  document.addEventListener('click', handleGlobalClick, true)
  document.addEventListener('submit', handleGlobalSubmit, true)
  console.log('[SecureGPT] Global listeners attached (Capturing phase)')
}

function handleGlobalKeyDown(e: KeyboardEvent): void {
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
  if (!e.isTrusted) return

  const root = findEditableRoot(e.target)
  if (!root || bypassSet.has(root)) return

  // CRITICAL: Block synchronously in the same tick
  console.log('[SecureGPT] Intercepted Enter key, blocking synchronously')
  e.preventDefault()
  e.stopImmediatePropagation()

  void handleSubmit(root)
}

function handleGlobalClick(e: MouseEvent): void {
  if (!e.isTrusted) return

  const target = e.target as HTMLElement
  const btn = target.closest('button, [role="button"]')
  if (!btn) return

  const aria = btn.getAttribute('aria-label')?.toLowerCase() || ''
  const testId = btn.getAttribute('data-testid')?.toLowerCase() || ''
  const isSendBtn = 
    aria.includes('send') || 
    aria.includes('submit') || 
    testId.includes('send') || 
    testId.includes('composer-button')

  if (isSendBtn) {
    const root = findMainEditor()
    if (!root || bypassSet.has(root)) return

    // CRITICAL: Block synchronously
    console.log('[SecureGPT] Intercepted Send button click, blocking synchronously')
    e.preventDefault()
    e.stopImmediatePropagation()

    void handleSubmit(root)
  }
}

function handleGlobalSubmit(e: Event): void {
  if (!e.isTrusted) return

  const root = findMainEditor()
  if (!root || bypassSet.has(root)) return

  // CRITICAL: Block synchronously
  console.log('[SecureGPT] Intercepted Form submit, blocking synchronously')
  e.preventDefault()
  e.stopImmediatePropagation()

  void handleSubmit(root)
}

async function handleSubmit(el: HTMLElement): Promise<void> {
  const isActive = await stateStorage.isActive()
  if (!isActive) {
    isRunning = false
    resubmit(el)
    return
  }

  if (isRunning) return
  isRunning = true

  try {
    const text = extractText(el)
    if (!text || text.trim().length === 0) {
      isRunning = false
      resubmit(el)
      return
    }

    const result = await detectPII(text, currentPolicy)
    console.log('[SecureGPT] Detection result:', result)

    if (!result.hasFindings) {
      isRunning = false
      resubmit(el)
      return
    }

    const topEntity = result.entities[0]
    const categoryConfig = currentPolicy.categories[topEntity.category]
    const action = categoryConfig?.action ?? 'BLOCK'
    console.log(`[SecureGPT] Action: ${action} for ${topEntity.category}`)

    switch (action) {
      case 'BLOCK': {
        showBanner('block', topEntity.category, result.entities.length)
        await logDetectionEvent(result, action)
        await stateStorage.incrementStat('block')
        break
      }

      case 'MASK': {
        const maskedText = applyMasking(text, result.entities)
        setInputValue(el, maskedText)
        showBanner('mask', topEntity.category, result.entities.length)
        await logDetectionEvent(result, action)
        await stateStorage.incrementStat('mask')
        setTimeout(() => resubmit(el), 100)
        break
      }

      case 'WARN_ALLOW': {
        showShieldModal(result, currentPolicy, text, async (proceed, _masked, acknowledged) => {
          if (proceed) {
            await logDetectionEvent(result, action, acknowledged)
            resubmit(el)
          }
          removeBanner()
        })
        await stateStorage.incrementStat('warn')
        break
      }

      case 'ALLOW': {
        await logDetectionEvent(result, action)
        resubmit(el)
        break
      }
    }
  } catch (err) {
    console.error('[SecureGPT] Error in handleSubmit:', err)
    isRunning = false
    resubmit(el)
  } finally {
    isRunning = false
  }
}

function setInputValue(el: HTMLElement, text: string): void {
  if (el.getAttribute('contenteditable')) {
    el.innerText = text
  } else {
    (el as HTMLTextAreaElement).value = text
  }

  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function resubmit(el: HTMLElement): void {
  console.log('[SecureGPT] Resubmitting...')
  bypassSet.add(el)

  // Simulation
  const options: KeyboardEventInit = {
    key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
    bubbles: true, cancelable: true, composed: true
  }
  el.dispatchEvent(new KeyboardEvent('keydown', options))

  setTimeout(() => {
    const text = extractText(el)
    if (text.length > 0) {
      const btn = document.querySelector<HTMLButtonElement>(
        'button[data-testid="send-button"], button[aria-label="Send message"], button[aria-label="Submit"]'
      )
      btn?.click()
    }
    setTimeout(() => bypassSet.delete(el), 1000)
  }, 200)
}

function teardown(): void {
  document.removeEventListener('keydown', handleGlobalKeyDown, true)
  document.removeEventListener('click', handleGlobalClick, true)
  document.removeEventListener('submit', handleGlobalSubmit, true)
  document.querySelectorAll('[data-securegpt]').forEach((el) => el.remove())
}
