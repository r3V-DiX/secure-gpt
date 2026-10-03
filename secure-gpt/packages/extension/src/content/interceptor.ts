// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit, input, and focus events

import { findEditableRoot, findMainEditor, extractText, bypassSet } from './dom-utils'
import { updateRadialRiskGauge, hideRadialRiskGauge } from './radial-risk-gauge'
import { isOfficeFile, isMaskableOffice } from './file-scanner'
export { isOfficeFile, isMaskableOffice }
import type { PIIConfig, DetectionResult, PIIEntity } from '@securegpt/shared/types'
import { isExtensionContextValid, handleSubmit, getMostRestrictiveAction, type SubmitContext } from './submit-handler'
export { getMostRestrictiveAction }
import { handleGlobalPaste, handleGlobalFileChange, handleGlobalDrop, type FileListenerContext } from './file-drop-listener'

let currentPolicy: PIIConfig
let interceptorActive = false
let preAllowedText = ''

export function setPreAllowedText(text: string): void {
  preAllowedText = text
}
let inputDebounceTimer: ReturnType<typeof setTimeout> | null = null

// ── OCR / image state ────────────────────────────────────────────
const ocrCache = new Map<string, PIIEntity[]>()
let pendingOcrCount = 0
const incPending = () => { pendingOcrCount++ }
const decPending = () => { pendingOcrCount = Math.max(0, pendingOcrCount - 1) }
const getPendingCount = () => pendingOcrCount

const submitContext: SubmitContext = {
  getCurrentPolicy: () => currentPolicy,
  isProtectionActive: () => interceptorActive,
  getPreAllowedText: () => preAllowedText,
  ocrCache,
  getPendingCount,
}

const fileListenerContext: FileListenerContext = {
  getCurrentPolicy: () => currentPolicy,
  isProtectionActive: () => interceptorActive,
  ocrCache,
  incPending,
  decPending,
  getPendingCount,
}

export function setupInterceptor(policy: PIIConfig): void {
  currentPolicy = policy
  teardown()
  interceptorActive = true
  attachGlobalListeners()
}

function onGlobalPaste(ev: ClipboardEvent): void {
  if (!isExtensionContextValid()) { teardown(); return }
  handleGlobalPaste(ev, fileListenerContext)
}

function onGlobalFileChange(ev: Event): void {
  if (!isExtensionContextValid()) { teardown(); return }
  handleGlobalFileChange(ev, fileListenerContext)
}

function onGlobalDrop(ev: DragEvent): void {
  if (!isExtensionContextValid()) { teardown(); return }
  handleGlobalDrop(ev, fileListenerContext)
}

function attachGlobalListeners(): void {
  window.addEventListener('keydown', handleGlobalKeyDown, true)
  window.addEventListener('click', handleGlobalClick, true)
  window.addEventListener('submit', handleGlobalSubmit, true)
  window.addEventListener('paste', onGlobalPaste, true)
  window.addEventListener('change', onGlobalFileChange, true)
  window.addEventListener('drop', onGlobalDrop, true)
  window.addEventListener('input', handleGlobalInput, true)
  window.addEventListener('focusin', handleGlobalFocus, true)
  window.addEventListener('focusout', handleGlobalBlur, true)
  console.log('[SecureGPT] Global listeners attached (Capturing phase)')
}

function handleGlobalKeyDown(e: KeyboardEvent): void {
  if (!isExtensionContextValid()) { teardown(); return }
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
  if (!e.isTrusted) return

  const root = findEditableRoot(e.target)
  if (!root || bypassSet.has(root)) return

  console.log('[SecureGPT] Intercepted Enter key, blocking synchronously')
  e.preventDefault()
  e.stopImmediatePropagation()

  void handleSubmit(root, submitContext)
}

function handleGlobalClick(e: MouseEvent): void {
  if (!isExtensionContextValid()) { teardown(); return }
  if (!e.isTrusted) return

  const target = e.target as HTMLElement
  const btn = target.closest<HTMLElement>('button, [role="button"]')
  if (!btn) return

  const aria = (btn.getAttribute('aria-label') || '').toLowerCase()
  const testId = (btn.getAttribute('data-testid') || '').toLowerCase()
  const btnText = (btn.innerText || btn.textContent || '').trim().toLowerCase()
  const hasSendSvg = !!btn.querySelector('svg path[d*="M13.22"], svg path[d*="M.5 1.5"], svg[class*="send"], svg[data-icon="arrow-up"]')
  const isSendBtn =
    aria.includes('send') ||
    aria.includes('submit') ||
    aria.includes('ask') ||
    aria.includes('search') ||
    aria.includes('generate') ||
    testId.includes('send') ||
    testId.includes('submit') ||
    testId.includes('ask') ||
    testId.includes('composer-button') ||
    btnText === 'send' ||
    hasSendSvg

  if (isSendBtn) {
    const root = findEditableRoot(document.activeElement) ?? findMainEditor()
    if (!root || bypassSet.has(root)) return

    console.log('[SecureGPT] Intercepted Send button click, blocking synchronously')
    e.preventDefault()
    e.stopImmediatePropagation()

    void handleSubmit(root, submitContext)
  }
}

function handleGlobalSubmit(e: Event): void {
  if (!isExtensionContextValid()) { teardown(); return }
  if (!e.isTrusted) return

  const root = findMainEditor()
  if (!root || bypassSet.has(root)) return

  console.log('[SecureGPT] Intercepted Form submit, blocking synchronously')
  e.preventDefault()
  e.stopImmediatePropagation()

  void handleSubmit(root, submitContext)
}

function handleGlobalFocus(e: FocusEvent): void {
  if (!isExtensionContextValid()) { teardown(); return }
  if (!e.isTrusted) return
  const target = e.target as HTMLElement
  const root = findEditableRoot(target)
  if (!root || bypassSet.has(root)) return

  const text = extractText(root)
  updateRadialRiskGauge(root, 0, [], text, currentPolicy)
}

function handleGlobalBlur(e: FocusEvent): void {
  const target = e.target as HTMLElement
  const root = findEditableRoot(target)
  if (!root) return

  setTimeout(() => {
    const text = extractText(root)
    if (!text || text.trim().length === 0) {
      hideRadialRiskGauge()
    }
  }, 250)
}

async function handleGlobalInput(e: Event): Promise<void> {
  if (!isExtensionContextValid()) { teardown(); return }
  if (!e.isTrusted) return

  const target = e.target as HTMLElement
  const root = findEditableRoot(target)
  if (!root || bypassSet.has(root)) return

  if (inputDebounceTimer) clearTimeout(inputDebounceTimer)

  inputDebounceTimer = setTimeout(async () => {
    if (!isExtensionContextValid()) return

    const text = extractText(root)
    if (!text || text.trim().length === 0) {
      updateRadialRiskGauge(root, 0, [], '', currentPolicy)
      return
    }

    if (text === preAllowedText) {
      updateRadialRiskGauge(root, 0, [], text, currentPolicy)
      return
    }

    try {
      const isActive = await new Promise<boolean>((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
          if (chrome.runtime.lastError) {
            resolve(true)
          } else {
            resolve(res?.active ?? true)
          }
        })
      })

      if (!isActive) {
        hideRadialRiskGauge()
        return
      }

      const result = await new Promise<DetectionResult>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'DETECT_PII', text, config: currentPolicy },
          (res) => {
            if (chrome.runtime.lastError || !res) {
              resolve({ hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: text.length })
            } else {
              resolve(res)
            }
          }
        )
      })

      updateRadialRiskGauge(root, result.hasFindings ? result.entities.length : 0, result.entities, text, currentPolicy)
    } catch (err) {
      console.error('[SecureGPT] Live detection error:', err)
    }
  }, 600)
}

export function teardown(): void {
  interceptorActive = false
  ocrCache.clear()
  if (inputDebounceTimer) clearTimeout(inputDebounceTimer)
  inputDebounceTimer = null
  window.removeEventListener('keydown', handleGlobalKeyDown, true)
  window.removeEventListener('click', handleGlobalClick, true)
  window.removeEventListener('submit', handleGlobalSubmit, true)
  window.removeEventListener('paste', onGlobalPaste, true)
  window.removeEventListener('change', onGlobalFileChange, true)
  window.removeEventListener('drop', onGlobalDrop, true)
  window.removeEventListener('input', handleGlobalInput, true)
  window.removeEventListener('focusin', handleGlobalFocus, true)
  window.removeEventListener('focusout', handleGlobalBlur, true)
  document.querySelectorAll('[data-securegpt]').forEach((el) => el.remove())
  hideRadialRiskGauge()
}
