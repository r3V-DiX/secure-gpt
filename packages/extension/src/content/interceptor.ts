// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit events

import { findEditableRoot, findMainEditor, findSendButton, extractText, bypassSet, dispatchImagePaste, dispatchFilePaste, clearAttachments } from './dom-utils'
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { logDetectionEvent } from './audit-logger'
import { applyMasking, applyImageMasking } from '@/features/actions/services/masking.service'
import type { PIIConfig, DetectionResult, PIIEntity } from '@securegpt/shared/types'

let currentPolicy: PIIConfig
let isRunning = false

// ── OCR / image state ────────────────────────────────────────────
const ocrCache = new Map<string, PIIEntity[]>()
let pendingOcrCount = 0
const incPending = () => { pendingOcrCount++ }
const decPending = () => { pendingOcrCount = Math.max(0, pendingOcrCount - 1) }

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
    // Use the editor that's currently focused, falling back to the main editor.
    // We resolve the element here and pass it through so bypassSet uses a
    // consistent reference — prevents the "different-element" loop (Bug 12).
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

const ACTION_PRIORITY: Record<string, number> = {
  BLOCK: 3,
  MASK: 2,
  WARN_ALLOW: 1,
  ALLOW: 0,
}

function getMostRestrictiveAction(entities: PIIEntity[], policy: PIIConfig): { action: string; topEntity: PIIEntity } {
  let maxPriority = -1
  let topAction = 'ALLOW'
  let topEntity = entities[0]!

  for (const entity of entities) {
    const catConfig = policy.categories[entity.category]
    // Per-rule action override takes precedence over the category-level action
    const ruleAction = catConfig?.ruleOverrides?.[entity.ruleId]?.action
    const action = ruleAction ?? catConfig?.action ?? 'ALLOW'
    const priority = ACTION_PRIORITY[action] ?? 0
    if (priority > maxPriority) {
      maxPriority = priority
      topAction = action
      topEntity = entity
    }
  }

  return { action: topAction, topEntity }
}

async function handleSubmit(el: HTMLElement): Promise<void> {
  // Guard: extension reloaded, context gone — let submission pass naturally
  if (!isExtensionContextValid()) {
    console.warn('[SecureGPT] Extension context invalidated — refresh the page to re-enable protection')
    return
  }

  // Bug 1 fix: set isRunning synchronously BEFORE any await so concurrent calls
  // from a second keydown/click during the async GET_STATE round-trip are blocked.
  if (isRunning) return
  isRunning = true

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

    // Wait for any in-flight image/PDF OCR to finish before checking text
    if (pendingOcrCount > 0) {
      console.log('[SecureGPT] Waiting for pending OCR…')
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 100))
        if (pendingOcrCount === 0) break
      }
    }

    const text = extractText(el)
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

    // ── BLOCK ─────────────────────────────────────
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

    // ── ALLOW ─────────────────────────────────────
    if (action === 'ALLOW') {
      void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'ALLOW', topEntity, false)
      isRunning = false
      resubmit(el)
      return
    }

    // ── MASK ──────────────────────────────────────
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

    // ── WARN_ALLOW ────────────────────────────────
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

// Bug 15 fix: when execCommand fails, use a synthetic paste event so React/ProseMirror
// processes the replacement through its own event system rather than a raw DOM write.
function setInputValue(el: HTMLElement, text: string): void {
  if (el.getAttribute('contenteditable')) {
    el.focus()

    const selection = window.getSelection()
    if (selection) {
      const range = document.createRange()
      range.selectNodeContents(el)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    el.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    }))

    const success = document.execCommand('insertText', false, text)

    if (!success) {
      // Fallback: inject via synthetic paste so React's event system handles the update
      bypassSet.add(el)
      const dt = new DataTransfer()
      dt.setData('text/plain', text)
      el.dispatchEvent(new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
        composed: true,
      }))
      setTimeout(() => bypassSet.delete(el), 50)
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
      const btn = findSendButton()
      btn?.click()
    }
    setTimeout(() => bypassSet.delete(el), 1000)
  }, 200)
}

export function teardown(): void {
  window.removeEventListener('keydown', handleGlobalKeyDown, true)
  window.removeEventListener('click', handleGlobalClick, true)
  window.removeEventListener('submit', handleGlobalSubmit, true)
  window.removeEventListener('paste', handleGlobalPaste, true)
  window.removeEventListener('change', handleGlobalFileChange, true)
  window.removeEventListener('drop', handleGlobalDrop, true)
  document.querySelectorAll('[data-securegpt]').forEach((el) => el.remove())
}

// ── Image paste interception ──────────────────

async function handleImagePasteInternal(el: HTMLElement, imgUrl: string): Promise<void> {
  try {
    incPending()
    console.info('[SecureGPT] Image paste detected, running OCR scan…')
    showBanner('loading', 'FINANCIAL', 0)

    const result = await new Promise<DetectionResult>((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'DETECT_PII_IMAGE', imgUrl, config: currentPolicy },
        (res) => {
          if (chrome.runtime.lastError || !res) {
            resolve({ hasFindings: false, entities: [], tier: 'ocr', processingTimeMs: 0, inputLength: 0 })
          } else {
            resolve(res)
          }
        }
      )
    })

    if (result.hasFindings && result.entities.length > 0) {
      console.info(`[SecureGPT] OCR found ${result.entities.length} entities. Redacting before upload…`)
      const baseImg = result.rotatedImageUrl || imgUrl
      const redactedUrl = await applyImageMasking(baseImg, result.entities)
      ocrCache.set(redactedUrl, result.entities)
      await dispatchImagePaste(el, redactedUrl)
    } else {
      console.info('[SecureGPT] Pasted image is clean. Re-injecting…')
      ocrCache.set(imgUrl, [])
      await dispatchImagePaste(el, imgUrl)
    }
  } catch (err) {
    console.error('[SecureGPT] Image paste scan error:', err)
    await dispatchImagePaste(el, imgUrl)
  } finally {
    decPending()
    if (pendingOcrCount === 0) removeBanner()
  }
}

function handleGlobalPaste(ev: ClipboardEvent): void {
  if (!ev.isTrusted) return
  const items = ev.clipboardData?.items
  if (!items) return

  let targetItem: DataTransferItem | null = null
  const itemList = Array.from(items as unknown as DataTransferItem[])
  for (const item of itemList) {
    if (item.type.startsWith('image/') || item.type === 'application/pdf') {
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

  if (isPdf) {
    void handleFileScan(el as HTMLElement, blob)
  } else {
    const reader = new FileReader()
    reader.onload = () => {
      const imgUrl = reader.result as string
      void handleImagePasteInternal(el as HTMLElement, imgUrl)
    }
    reader.readAsDataURL(blob)
  }
}

// ── File upload interception ──────────────────

async function handleFileScan(el: HTMLElement, file: File): Promise<void> {
  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isImage && !isPdf) return

  try {
    incPending()
    console.info(`[SecureGPT] ${isPdf ? 'PDF' : 'Image'} upload detected, scanning: ${file.name}`)
    showBanner('loading', 'FINANCIAL' as any, 0)

    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    const result = await new Promise<DetectionResult>((resolve) => {
      const msgType = isImage ? 'DETECT_PII_IMAGE' : 'DETECT_PII_PDF'
      chrome.runtime.sendMessage(
        { type: msgType, imgUrl: dataUrl, pdfData: dataUrl, config: currentPolicy },
        (res) => {
          if (chrome.runtime.lastError || !res) {
            resolve({ hasFindings: false, entities: [], tier: 'ocr', processingTimeMs: 0, inputLength: 0 })
          } else {
            resolve(res)
          }
        }
      )
    })

    if (result.hasFindings && result.entities.length > 0) {
      console.info(`[SecureGPT] Found ${result.entities.length} entities in ${file.name}. Redacting before upload…`)

      let redactedUrl = dataUrl
      if (isPdf) {
        const resp = await new Promise<{ ok: boolean; redactedPdfData?: string }>((resolve) => {
          chrome.runtime.sendMessage({ type: 'REDACT_PDF', pdfData: dataUrl, entities: result.entities }, resolve)
        })
        if (resp && resp.ok && resp.redactedPdfData) {
          redactedUrl = resp.redactedPdfData
        } else {
          console.error('[SecureGPT] PDF pre-upload redaction failed')
          return
        }
      } else {
        const baseImg = result.rotatedImageUrl || dataUrl
        redactedUrl = await applyImageMasking(baseImg, result.entities)
      }

      ocrCache.set(redactedUrl, result.entities)
      await dispatchFilePaste(el, redactedUrl, file.name, file.type)
    } else {
      console.info(`[SecureGPT] ${file.name} is clean. Forwarding original.`)
      ocrCache.set(dataUrl, [])
      await dispatchFilePaste(el, dataUrl, file.name, file.type)
    }
  } catch (err) {
    console.error(`[SecureGPT] File scan error for ${file.name}:`, err)
  } finally {
    decPending()
    if (pendingOcrCount === 0) removeBanner()
  }
}

function handleGlobalFileChange(ev: Event): void {
  if (!ev.isTrusted) return
  const target = ev.target as HTMLInputElement
  if (target.type !== 'file' || !target.files?.length) return

  const file = target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return

  const el = findMainEditor() ?? document.body as HTMLElement
  if (bypassSet.has(el)) return

  // Bug 16 fix: preventDefault on 'change' is a no-op (not cancelable).
  // Removed the misleading call. File reset via target.value = '' is sufficient.
  ev.stopImmediatePropagation()
  target.value = ''
  void handleFileScan(el, file)
}

function handleGlobalDrop(ev: DragEvent): void {
  if (!ev.isTrusted) return
  const files = ev.dataTransfer?.files
  if (!files?.length) return

  const file = files[0]
  if (!file) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return

  const el = findMainEditor() ?? document.body as HTMLElement
  if (bypassSet.has(el)) return

  ev.preventDefault()
  ev.stopImmediatePropagation()
  void handleFileScan(el, file)
}
