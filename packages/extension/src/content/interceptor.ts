// packages/extension/src/content/interceptor.ts
// Interceptor — hooks into LLM page submit events
// All detections go through the ShieldModal — user decides action

import { findEditableRoot, findMainEditor, extractText, bypassSet, dispatchImagePaste, dispatchFilePaste, clearAttachments } from './dom-utils'
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { applyMasking, applyImageMasking } from '@/features/actions/services/masking.service'
import type { PIIConfig, DetectionResult, PIIEntity } from '@securegpt/shared/types'

let currentPolicy: PIIConfig
let isRunning = false

// ── OCR / image state ────────────────────────────────────────────
// Cache of image data URLs → detected entities, built during paste/upload.
// Cleared once the user's submission is handled.
const ocrCache = new Map<string, PIIEntity[]>()
let pendingOcrCount = 0
const incPending = () => { pendingOcrCount++ }
const decPending = () => { pendingOcrCount = Math.max(0, pendingOcrCount - 1) }

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
  document.addEventListener('paste', handleGlobalPaste, true)
  document.addEventListener('change', handleGlobalFileChange, true)
  document.addEventListener('drop', handleGlobalDrop, true)
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

    // --- Delegate detection to background script ---
    console.log('[SecureGPT] Requesting detection from background...')

    // Merge any image entities already detected via OCR cache
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
      // Image only, no text provided
      result = { hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: 0 }
    }
    console.log('[SecureGPT] Detection result:', result)

    // Merge OCR image entities with text detection results
    const mergedEntities = [...result.entities, ...allOcrEntities]
    const hasFindings = result.hasFindings || allOcrEntities.length > 0

    // No sensitive data found — let it through
    if (!hasFindings) {
      ocrCache.clear()
      isRunning = false
      resubmit(el)
      return
    }

    const topEntity = mergedEntities[0] ?? result.entities[0]
    if (!topEntity) {
      ocrCache.clear()
      isRunning = false
      resubmit(el)
      return
    }
    const categoryConfig = currentPolicy.categories[topEntity.category]
    const action = categoryConfig?.action ?? 'BLOCK'
    console.log(`[SecureGPT] Action: ${action} for ${topEntity.category}`)

    // ── BLOCK: hard stop, banner only, no modal ───
    if (action === 'BLOCK') {
      showBanner('block', topEntity.category, result.entities.length)
      chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
      
      // The user is blocked from submitting, but we should visually redact the image
      // in their input box so it's not sitting there exposed.
      let hasCleared = false
      for (const [imgUrl, currEntities] of ocrCache.entries()) {
        if (currEntities.length > 0) {
          const redactedUrl = await applyImageMasking(imgUrl, currEntities)
          if (!hasCleared) {
            await clearAttachments()
            hasCleared = true
          }
          await dispatchImagePaste(el, redactedUrl)
        }
      }
      ocrCache.clear()

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
          // Mask & Send — redact text and any cached images
          const maskedText = applyMasking(text, mergedEntities)
          setInputValue(el, maskedText)

          // Redact and re-inject any sensitive images
          let hasCleared = false
          for (const [imgUrl, entities] of ocrCache.entries()) {
            if (entities.length > 0) {
              const redactedUrl = await applyImageMasking(imgUrl, entities)
              if (!hasCleared) {
                await clearAttachments()
                hasCleared = true
              }
              await dispatchImagePaste(el, redactedUrl)
            }
          }
          ocrCache.clear()

          chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
          showBanner('mask', topEntity.category, mergedEntities.length)
          setTimeout(() => resubmit(el), 100)
        } else {
          // Send Directly
          ocrCache.clear()
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
  document.removeEventListener('paste', handleGlobalPaste, true)
  document.removeEventListener('change', handleGlobalFileChange, true)
  document.removeEventListener('drop', handleGlobalDrop, true)
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
      console.info(`[SecureGPT] OCR found ${result.entities.length} entities in pasted image.`)
      ocrCache.set(imgUrl, result.entities)
      // Re-inject original image for now; masked version will be dispatched on "Mask & Send"
      await dispatchImagePaste(el, imgUrl)
    } else {
      console.info('[SecureGPT] Pasted image is clean. Re-injecting…')
      ocrCache.delete(imgUrl)
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

  let imageItem: DataTransferItem | null = null
  const itemList = Array.from(items as unknown as DataTransferItem[])
  for (const item of itemList) {
    if (item.type.startsWith('image/')) { imageItem = item; break }
  }
  if (!imageItem) return

  const el = findEditableRoot(ev.target) ?? findEditableRoot(document.activeElement)
  if (!el || bypassSet.has(el)) return

  // Block immediately (must be synchronous)
  ev.preventDefault()
  ev.stopImmediatePropagation()

  // Extract the image while clipboardData is still in scope
  const blob = imageItem.getAsFile()
  if (!blob) return
  const reader = new FileReader()
  reader.onload = () => {
    const imgUrl = reader.result as string
    void handleImagePasteInternal(el as HTMLElement, imgUrl)
  }
  reader.readAsDataURL(blob)
}

// ── File upload interception ──────────────────

async function handleFileScan(el: HTMLElement, file: File): Promise<void> {
  const isImage = file.type.startsWith('image/')
  const isPdf   = file.type === 'application/pdf'
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
      console.info(`[SecureGPT] Found ${result.entities.length} entities in ${file.name}.`)
      ocrCache.set(dataUrl, result.entities)
      await dispatchFilePaste(el, dataUrl, file.name, file.type)
    } else {
      console.info(`[SecureGPT] ${file.name} is clean. Forwarding original.`)
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
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return

  const el = findMainEditor() ?? document.body as HTMLElement
  if (bypassSet.has(el)) return

  ev.preventDefault()
  ev.stopImmediatePropagation()
  target.value = '' // Reset so same file can be re-chosen after masking
  void handleFileScan(el, file)
}

function handleGlobalDrop(ev: DragEvent): void {
  if (!ev.isTrusted) return
  const files = ev.dataTransfer?.files
  if (!files?.length) return

  const file = files[0]
  if (!file) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return

  const el = findMainEditor() ?? document.body as HTMLElement
  if (bypassSet.has(el)) return

  ev.preventDefault()
  ev.stopImmediatePropagation()
  void handleFileScan(el, file)
}