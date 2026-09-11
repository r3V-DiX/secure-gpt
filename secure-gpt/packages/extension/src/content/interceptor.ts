// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit events

import { findEditableRoot, findMainEditor, extractText, bypassSet, clearAttachments, dispatchFilePaste, dispatchImagePaste } from './dom-utils'
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { logDetectionEvent } from './audit-logger'
import { applyMasking } from '@/features/actions/services/masking.service'
import { updateRadialRiskGauge, hideRadialRiskGauge } from './radial-risk-gauge'
import { setInputValue, resubmit } from './text-replacer'
import { waitForPendingOcr } from './ocr-wait-handler'
import { handleFileScan, handleImagePasteInternal, isOfficeFile, isMaskableOffice } from './file-scanner'
export { isOfficeFile, isMaskableOffice }
import type { PIIConfig, DetectionResult, PIIEntity } from '@securegpt/shared/types'
import { POLICY_ACTION_PRIORITY, type PolicyAction } from '@securegpt/shared/constants'

let currentPolicy: PIIConfig
let isRunning = false
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
  window.addEventListener('keydown', handleGlobalKeyDown, true)
  window.addEventListener('click', handleGlobalClick, true)
  window.addEventListener('submit', handleGlobalSubmit, true)
  window.addEventListener('paste', handleGlobalPaste, true)
  window.addEventListener('change', handleGlobalFileChange, true)
  window.addEventListener('drop', handleGlobalDrop, true)
  window.addEventListener('input', handleGlobalInput, true)
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
      hideRadialRiskGauge()
      return
    }

    if (text === preAllowedText) {
      updateRadialRiskGauge(root, 0, [])
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

      updateRadialRiskGauge(root, result.hasFindings ? result.entities.length : 0, result.entities)
    } catch (err) {
      console.error('[SecureGPT] Live detection error:', err)
    }
  }, 600)
}

function getMostRestrictiveAction(entities: PIIEntity[], policy: PIIConfig): { action: PolicyAction; topEntity: PIIEntity } {
  let maxPriority = -1
  let topAction: PolicyAction = 'ALLOW'
  let topEntity = entities[0]!

  for (const entity of entities) {
    const catConfig = policy.categories[entity.category]
    const ruleAction = catConfig?.ruleOverrides?.[entity.ruleId]?.action as PolicyAction | undefined
    const action: PolicyAction = (ruleAction ?? catConfig?.action ?? 'ALLOW') as PolicyAction
    const priority = POLICY_ACTION_PRIORITY[action] ?? 0
    if (priority > maxPriority) {
      maxPriority = priority
      topAction = action
      topEntity = entity
    }
  }

  return { action: topAction, topEntity }
}

async function handleSubmit(el: HTMLElement): Promise<void> {
  if (!isExtensionContextValid()) {
    console.warn('[SecureGPT] Extension context invalidated — refresh the page to re-enable protection')
    return
  }

  if (isRunning) return
  isRunning = true

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
      isRunning = false
      resubmit(el)
      return
    }

    // Wait for in-flight image/PDF OCR to complete (with timeout)
    if (pendingOcrCount > 0) {
      await waitForPendingOcr(getPendingCount)
    }

    const text = extractText(el)
    
    if (text === preAllowedText && text.trim().length > 0) {
      console.log('[SecureGPT] Bypassing submit detection because text was pre-allowed via live tooltip.')
      isRunning = false
      resubmit(el)
      return
    }

    const hasCachedImages = ocrCache.size > 0
    if ((!text || text.trim().length === 0) && !hasCachedImages) {
      isRunning = false
      resubmit(el)
      return
    }

    console.log('[SecureGPT] Requesting detection from background...')
    const allOcrEntities = Array.from(ocrCache.values()).flat()

    let result: DetectionResult
    if (text.trim().length > 0) {
      result = await new Promise<DetectionResult>((resolve) => {
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
    } else {
      result = { hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: 0 }
    }
    console.log('[SecureGPT] Detection result:', result)

    const mergedEntities = [...result.entities, ...allOcrEntities]
    const hasFindings = result.hasFindings || allOcrEntities.length > 0

    if (!hasFindings) {
      ocrCache.clear()
      isRunning = false
      resubmit(el)
      return
    }

    const { action, topEntity } = getMostRestrictiveAction(mergedEntities, currentPolicy)
    console.log(`[SecureGPT] Primary Action: ${action} triggered by ${topEntity.category}`)

    if (action === 'BLOCK') {
      showBanner('block', topEntity.category, mergedEntities.length, undefined, () => {
        showShieldModal(
          { ...result, entities: mergedEntities, hasFindings },
          currentPolicy,
          text,
          undefined,
          true,
          'Blocked: PII/Confidentiality Leak Detected'
        )
      })
      void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
      void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'BLOCK', topEntity, false)
      ocrCache.clear()
      isRunning = false
      return
    }

    if (action === 'ALLOW') {
      void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'ALLOW', topEntity, false)
      isRunning = false
      resubmit(el)
      return
    }

    if (action === 'MASK') {
      console.log('[SecureGPT] Automatic masking triggered')
      const maskedText = applyMasking(text, result.entities)
      setInputValue(el, maskedText)

      await clearAttachments()
      for (const [fileUrl] of ocrCache.entries()) {
        const isPdf = fileUrl.startsWith('data:application/pdf')
        if (isPdf) {
          await dispatchFilePaste(el, fileUrl, 'redacted.pdf', 'application/pdf')
        } else {
          await dispatchImagePaste(el, fileUrl)
        }
      }
      ocrCache.clear()

      void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
      void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'MASK', topEntity, false)
      showBanner('mask', topEntity.category, mergedEntities.length, undefined, () => {
        showShieldModal(
          { ...result, entities: mergedEntities, hasFindings },
          currentPolicy,
          text,
          undefined,
          true,
          'Masked: Sensitive Data Redacted'
        )
      })

      isRunning = false
      setTimeout(() => resubmit(el), 400)
      return
    }

    // WARN_ALLOW
    isRunning = false
    showShieldModal(
      { ...result, entities: mergedEntities, hasFindings },
      currentPolicy,
      text,
      async (proceed, masked, _acknowledged) => {
        removeBanner()

        if (!proceed) {
          console.log('[SecureGPT] User cancelled submission')
          return
        }

        if (masked) {
          const maskedText = applyMasking(text, result.entities)
          setInputValue(el, maskedText)

          await clearAttachments()
          for (const [fileUrl] of ocrCache.entries()) {
            const isPdf = fileUrl.startsWith('data:application/pdf')
            if (isPdf) {
              await dispatchFilePaste(el, fileUrl, 'redacted.pdf', 'application/pdf')
            } else {
              await dispatchImagePaste(el, fileUrl)
            }
          }
          ocrCache.clear()

          void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
          void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'MASK', topEntity, false)
          showBanner('mask', topEntity.category, mergedEntities.length, undefined, () => {
            showShieldModal(
              { ...result, entities: mergedEntities, hasFindings },
              currentPolicy,
              text,
              undefined,
              true,
              'Masked: Sensitive Data Redacted'
            )
          })

          setTimeout(() => resubmit(el), 400)
        } else {
          ocrCache.clear()
          void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'warn' })
          void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'WARN_ALLOW', topEntity, true)
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

export function teardown(): void {
  window.removeEventListener('keydown', handleGlobalKeyDown, true)
  window.removeEventListener('click', handleGlobalClick, true)
  window.removeEventListener('submit', handleGlobalSubmit, true)
  window.removeEventListener('paste', handleGlobalPaste, true)
  window.removeEventListener('change', handleGlobalFileChange, true)
  window.removeEventListener('drop', handleGlobalDrop, true)
  window.removeEventListener('input', handleGlobalInput, true)
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

