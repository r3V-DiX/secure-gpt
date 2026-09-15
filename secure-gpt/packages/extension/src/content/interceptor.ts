// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit events

import { findEditableRoot, findMainEditor, extractText, bypassSet } from './dom-utils'
import { updateRadialRiskGauge, hideRadialRiskGauge } from './radial-risk-gauge'
import { handleFileScan, handleImagePasteInternal, isOfficeFile, isMaskableOffice } from './file-scanner'
export { isOfficeFile, isMaskableOffice }
import type { PIIConfig, DetectionResult, PIIEntity } from '@securegpt/shared/types'
import { isExtensionContextValid, handleSubmit, getMostRestrictiveAction, type SubmitContext } from './submit-handler'
export { getMostRestrictiveAction }

let currentPolicy: PIIConfig
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
  getPreAllowedText: () => preAllowedText,
  ocrCache,
  getPendingCount,
}

export function setupInterceptor(policy: PIIConfig): void {
  currentPolicy = policy
  teardown()
  attachGlobalListeners()
}

function attachGlobalListeners(): void {
  window.addEventListener('keydown', handleGlobalKeyDown, true)
  window.addEventListener('click', handleGlobalClick, true)
  window.addEventListener('submit', handleGlobalSubmit, true)
  window.addEventListener('paste', handleGlobalPaste, true)
  window.addEventListener('change', handleGlobalFileChange, true)
  window.addEventListener('drop', handleGlobalDrop, true)
  window.addEventListener('input', handleGlobalInput, true)
  window.addEventListener('focusin', handleGlobalFocus, true)
  window.addEventListener('focusout', handleGlobalBlur, true)
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

  void handleSubmit(root, submitContext)
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
    aria.includes('ask') ||
    aria.includes('search') ||
    testId.includes('send') ||
    testId.includes('submit') ||
    testId.includes('ask') ||
    testId.includes('composer-button')

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
  if (!e.isTrusted) return

  const root = findMainEditor()
  if (!root || bypassSet.has(root)) return

  console.log('[SecureGPT] Intercepted Form submit, blocking synchronously')
  e.preventDefault()
  e.stopImmediatePropagation()

  void handleSubmit(root, submitContext)
}

function handleGlobalFocus(e: FocusEvent): void {
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
  window.removeEventListener('keydown', handleGlobalKeyDown, true)
  window.removeEventListener('click', handleGlobalClick, true)
  window.removeEventListener('submit', handleGlobalSubmit, true)
  window.removeEventListener('paste', handleGlobalPaste, true)
  window.removeEventListener('change', handleGlobalFileChange, true)
  window.removeEventListener('drop', handleGlobalDrop, true)
  window.removeEventListener('input', handleGlobalInput, true)
  window.removeEventListener('focusin', handleGlobalFocus, true)
  window.removeEventListener('focusout', handleGlobalBlur, true)
  document.querySelectorAll('[data-securegpt]').forEach((el) => el.remove())
  hideRadialRiskGauge()
}

function handleGlobalPaste(ev: ClipboardEvent): void {
  if (!ev.isTrusted) return
  const items = ev.clipboardData?.items
  if (!items) return

  let targetItem: DataTransferItem | null = null
  const itemList = Array.from(items as unknown as DataTransferItem[])
  for (const item of itemList) {
    const blob = item.kind === 'file' ? item.getAsFile() : null
    if (item.type.startsWith('image/') || item.type === 'application/pdf' || (blob && isOfficeFile(blob))) {
      targetItem = item
      break
    }
  }
  if (!targetItem) return

  const el = findEditableRoot(ev.target) ?? findEditableRoot(document.activeElement)
  if (!el || bypassSet.has(el)) return

  ev.preventDefault()
  ev.stopImmediatePropagation()

  const blob = targetItem.getAsFile()
  if (!blob) return

  const isPdf = targetItem.type === 'application/pdf' || blob.name.toLowerCase().endsWith('.pdf')
  const isOffice = isOfficeFile(blob)

  if (isPdf || isOffice) {
    void handleFileScan(el as HTMLElement, blob, currentPolicy, ocrCache, incPending, decPending, getPendingCount)
  } else {
    const reader = new FileReader()
    reader.onload = () => {
      const imgUrl = reader.result as string
      void handleImagePasteInternal(el as HTMLElement, imgUrl, currentPolicy, ocrCache, incPending, decPending, getPendingCount)
    }
    reader.readAsDataURL(blob)
  }
}

function handleGlobalFileChange(ev: Event): void {
  if (!ev.isTrusted) return
  const target = ev.target as HTMLInputElement
  if (target.type !== 'file' || !target.files?.length) return

  const file = target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf') && !isOfficeFile(file)) return

  const el = findMainEditor() ?? document.body as HTMLElement
  if (bypassSet.has(el)) return

  ev.stopImmediatePropagation()
  target.value = ''
  void handleFileScan(el, file, currentPolicy, ocrCache, incPending, decPending, getPendingCount)
}

function handleGlobalDrop(ev: DragEvent): void {
  if (!ev.isTrusted) return
  const files = ev.dataTransfer?.files
  if (!files?.length) return

  const file = files[0]
  if (!file) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf') && !isOfficeFile(file)) return

  const el = findMainEditor() ?? document.body as HTMLElement
  if (bypassSet.has(el)) return

  ev.preventDefault()
  ev.stopImmediatePropagation()
  void handleFileScan(el, file, currentPolicy, ocrCache, incPending, decPending, getPendingCount)
}
