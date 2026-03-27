// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit events
// All detections go through the ShieldModal — user decides action

import { findEditableRoot, findMainEditor, extractText } from './dom-utils'
import { logDetectionEvent } from './audit-logger'
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { applyMasking } from '@/features/actions/services/masking.service'
import type { PIIConfig, DetectionResult } from '@securegpt/shared/types'

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
    const isActive = await new Promise<boolean>((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
        if (chrome.runtime.lastError) {
          resolve(true) // fallback to true if background is unreachable
        } else {
          resolve(res?.active ?? true)
        }
      })
    })

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

    // --- Delegate detection to background script ---
    console.log('[SecureGPT] Requesting detection from background...')
    const result = await new Promise<DetectionResult>((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'DETECT_PII', text, config: currentPolicy },
        (res) => {
          if (chrome.runtime.lastError) {
            console.error('[SecureGPT] Background detection error:', chrome.runtime.lastError)
            resolve({ hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: text.length })
          } else {
            resolve(res)
          }
        }
      )
    })
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
      chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
      isRunning = false
      return
    }

    // ── ALLOW: silent log + send ──────────────────
    if (action === 'ALLOW') {
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
          
          chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
          showBanner('mask', topEntity.category, result.entities.length)
          
          // Small delay before resubmit to let modern frameworks (React/ProseMirror) 
          // sync the DOM change into their internal state.
          setTimeout(() => resubmit(el), 100)
        } else {
          // Send Directly (acknowledge & send anyway)
          chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'warn' })
          resubmit(el)
        }
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
    // For modern LLM inputs (React/ProseMirror), simple innerText update 
    // doesn't trigger internal state change. execCommand('insertText') is more reliable.
    el.focus()
    
    // Select all existing text
    const selection = window.getSelection()
    if (selection) {
      const range = document.createRange()
      range.selectNodeContents(el)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    // Dispatch beforeinput for modern editors
    el.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    }))

    // Replace with masked text
    const success = document.execCommand('insertText', false, text)
    
    // Fallback if execCommand failed
    if (!success) {
      el.innerText = text
    }
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