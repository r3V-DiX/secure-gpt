// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit events
// All detections go through the ShieldModal — user decides action

import { detectPIIDemo as detectPII } from '@/lib/detection/demo-detection'
import { findEditableRoot, findMainEditor, extractText } from './dom-utils'
import { logDetectionEvent } from './audit-logger'
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { applyMasking } from '@/features/actions/services/masking.service'
import { stateStorage } from '@/lib/storage/storage'
import type { PIIConfig } from '@securegpt/shared/types'

let currentPolicy: PIIConfig
let isRunning = false

// Bypass set for resubmission
const bypassSet = new WeakSet<Element>()

// ── Extension context guard ───────────────────
function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id
  } catch {
    return false
  }
}

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

  console.log('[SecureGPT] Intercepted Form submit, blocking synchronously')
  e.preventDefault()
  e.stopImmediatePropagation()

  void handleSubmit(root)
}

async function handleSubmit(el: HTMLElement): Promise<void> {
  // Guard: extension reloaded, context gone — let submission pass naturally
  if (!isExtensionContextValid()) {
    console.warn('[SecureGPT] Extension context invalidated — refresh the page to re-enable protection')
    return
  }

  try {
    const isActive = await stateStorage.isActive()
    if (!isActive) {
      isRunning = false
      resubmit(el)
      return
    }

    if (isRunning) return
    isRunning = true

    const text = extractText(el)
    if (!text || text.trim().length === 0) {
      isRunning = false
      resubmit(el)
      return
    }

    const result = await detectPII(text, currentPolicy)
    console.log('[SecureGPT] Detection result:', result)

    // No sensitive data found — let it through
    if (!result.hasFindings) {
      isRunning = false
      resubmit(el)
      return
    }

    const topEntity = result.entities[0]
    const categoryConfig = currentPolicy.categories[topEntity.category]
    const action = categoryConfig?.action ?? 'BLOCK'
    console.log(`[SecureGPT] Action: ${action} for ${topEntity.category}`)

    // ── BLOCK: hard stop, banner only, no modal ───
    if (action === 'BLOCK') {
      showBanner('block', topEntity.category, result.entities.length)
      await logDetectionEvent(result, action)
      await stateStorage.incrementStat('block')
      isRunning = false
      return
    }

    // ── ALLOW: silent log + send ──────────────────
    if (action === 'ALLOW') {
      await logDetectionEvent(result, action)
      isRunning = false
      resubmit(el)
      return
    }

    // ── MASK / WARN_ALLOW: always show ShieldModal ─
    // User sees what was detected and chooses:
    //   • Mask & Send   → replaces sensitive values, then sends
    //   • Send Directly → sends original text (acknowledged)
    //   • Cancel        → keeps message in input, does nothing
    isRunning = false

    showShieldModal(
      result,
      currentPolicy,
      text,
      async (proceed, masked, acknowledged) => {
        removeBanner()

        if (!proceed) {
          console.log('[SecureGPT] User cancelled submission')
          return
        }

        if (masked) {
          // Mask & Send
          const maskedText = applyMasking(text, result.entities)
          setInputValue(el, maskedText)
          await logDetectionEvent(result, 'MASK', acknowledged)
          await stateStorage.incrementStat('mask')
          showBanner('mask', topEntity.category, result.entities.length)
        } else {
          // Send Directly (acknowledge & send anyway)
          await logDetectionEvent(result, action, acknowledged)
          await stateStorage.incrementStat('warn')
        }

        resubmit(el)
      }
    )

  } catch (err) {
    const message = (err as Error)?.message ?? ''
    if (message.includes('Extension context invalidated')) {
      console.warn('[SecureGPT] Extension context lost mid-flight — refresh the page')
    } else {
      console.error('[SecureGPT] Error in handleSubmit:', err)
    }
    isRunning = false
    resubmit(el)
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

  const options: KeyboardEventInit = {
    key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
    bubbles: true, cancelable: true, composed: true,
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