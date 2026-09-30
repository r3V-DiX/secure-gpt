// packages/extension/src/content/file-scanner.ts
// Handles file upload inspection (Images, PDFs, Office docs) and redaction

import { dispatchImagePaste, dispatchFilePaste, clearAttachments } from './dom-utils'
import { showBanner, removeBanner } from './banners'
import { logDetectionEvent } from './audit-logger'
import { applyImageMasking } from '@/features/actions/services/masking.service'
import { getMostRestrictiveAction } from './submit-handler'
import type { PIIConfig, DetectionResult, PIIEntity } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'

// Office MIME types are unreliable (docx often reports application/octet-stream),
// so detect by filename extension whitelist + known office MIME prefixes.
const OFFICE_EXTENSIONS = new Set([
  'doc', 'docx', 'docm',
  'ppt', 'pps', 'pot', 'pptx', 'pptm', 'ppsx', 'ppsm',
  'xls', 'xlsx', 'xlsm', 'xlsb',
  'odt', 'ods', 'odp',
  'rtf', 'epub', 'csv'
])

export function isOfficeFile(file: File): boolean {
  if (file.type.startsWith('application/vnd.ms-')) return true
  if (file.type.startsWith('application/vnd.openxmlformats-officedocument.')) return true
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  return OFFICE_EXTENSIONS.has(ext)
}

// Legacy binary OLE/BIFF formats aren't zip containers, so the backend can't
// structurally rewrite their text — these stay on the hard-block path.
const LEGACY_BINARY_EXTENSIONS = new Set(['doc', 'ppt', 'pps', 'pot', 'xls', 'xlsb'])

export function isMaskableOffice(file: File): boolean {
  if (!isOfficeFile(file)) return false
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  return !LEGACY_BINARY_EXTENSIONS.has(ext)
}

// anydoc conversion is synchronous in the offscreen document — cap office
// scans so a huge file can't stall it. Oversized files forward unscanned.
export const MAX_OFFICE_SCAN_BYTES = 20 * 1024 * 1024

export async function handleImagePasteInternal(
  el: HTMLElement,
  imgUrl: string,
  currentPolicy: PIIConfig,
  ocrCache: Map<string, PIIEntity[]>,
  incPending: () => void,
  decPending: () => void,
  getPendingCount: () => number,
  isScanningEnabled: () => boolean = () => true
): Promise<void> {
  if (!isScanningEnabled()) {
    await dispatchImagePaste(el, imgUrl)
    return
  }
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

    if (!isScanningEnabled()) {
      await dispatchImagePaste(el, imgUrl)
      return
    }

    if (result.hasFindings && result.entities.length > 0) {
      const { action, topEntity } = getMostRestrictiveAction(result.entities, currentPolicy)
      console.info(`[SecureGPT] OCR found ${result.entities.length} entities. Policy Action: ${action} (${topEntity.category})`)

      if (action === 'BLOCK') {
        await clearAttachments()
        showBanner('block', topEntity.category, result.entities.length)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'BLOCK', topEntity, false)
        return
      }

      console.info(`[SecureGPT] Redacting ${result.entities.length} entities before upload…`)
      const baseImg = result.rotatedImageUrl || imgUrl
      const redactedUrl = await applyImageMasking(baseImg, result.entities)
      if (!isScanningEnabled()) {
        await dispatchImagePaste(el, imgUrl)
        return
      }
      ocrCache.set(redactedUrl, result.entities)

      if (action === 'MASK') {
        showBanner('mask', topEntity.category, result.entities.length)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'MASK', topEntity, false)
      } else if (action === 'WARN_ALLOW') {
        showBanner('warn', topEntity.category, result.entities.length)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'warn' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'WARN_ALLOW', topEntity, true)
      }

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
    if (getPendingCount() === 0) removeBanner()
  }
}

export async function handleFileScan(
  el: HTMLElement,
  file: File,
  currentPolicy: PIIConfig,
  ocrCache: Map<string, PIIEntity[]>,
  incPending: () => void,
  decPending: () => void,
  getPendingCount: () => number,
  isScanningEnabled: () => boolean = () => true
): Promise<void> {
  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isOffice = isOfficeFile(file)
  if (!isImage && !isPdf && !isOffice) return

  if (!isScanningEnabled() || currentPolicy?.enableDocumentScanning === false) {
    console.info(`[SecureGPT] Document scanning disabled by policy — skipping inspection for ${file.name}`)
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    ocrCache.set(dataUrl, [])
    await dispatchFilePaste(el, dataUrl, file.name, file.type)
    return
  }

  const reader = new FileReader()
  const dataUrl = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })

  if (!isScanningEnabled()) {
    await dispatchFilePaste(el, dataUrl, file.name, file.type)
    return
  }

  if (isOffice && file.size > MAX_OFFICE_SCAN_BYTES) {
    console.warn(`[SecureGPT] ${file.name} exceeds ${MAX_OFFICE_SCAN_BYTES} bytes — forwarding unscanned.`)
    ocrCache.set(dataUrl, [])
    await dispatchFilePaste(el, dataUrl, file.name, file.type)
    return
  }

  try {
    incPending()
    console.info(`[SecureGPT] ${isPdf ? 'PDF' : isOffice ? 'Office doc' : 'Image'} upload detected, scanning: ${file.name}`)
    showBanner(isPdf ? 'loading_pdf' : 'loading', 'FINANCIAL' as PIICategory, 0)

    const result = await new Promise<DetectionResult>((resolve) => {
      const msgType = isImage ? 'DETECT_PII_IMAGE' : isPdf ? 'DETECT_PII_PDF' : 'DETECT_PII_OFFICE'
      chrome.runtime.sendMessage(
        { type: msgType, imgUrl: dataUrl, pdfData: dataUrl, config: currentPolicy, fileName: file.name },
        (res) => {
          if (chrome.runtime.lastError || !res) {
            resolve({ hasFindings: false, entities: [], tier: 'ocr', processingTimeMs: 0, inputLength: 0 })
          } else {
            resolve(res)
          }
        }
      )
    })

    if (!isScanningEnabled()) {
      await dispatchFilePaste(el, dataUrl, file.name, file.type)
      return
    }

    if (result.hasFindings && result.entities.length > 0) {
      const { action, topEntity } = getMostRestrictiveAction(result.entities, currentPolicy)
      console.info(`[SecureGPT] Found ${result.entities.length} entities in ${file.name}. Policy Action: ${action} (${topEntity.category})`)

      if (action === 'BLOCK' && !isOffice) {
        await clearAttachments()
        showBanner('block', topEntity.category, result.entities.length)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'BLOCK', topEntity, false)
        return
      }

      if (isOffice) {
        const topEntity = result.entities[0]
        if (!topEntity) return

        if (isMaskableOffice(file)) {
          const resp = await new Promise<{ ok: boolean; redactedPdfData?: string }>((resolve) => {
            chrome.runtime.sendMessage(
              { type: 'REDACT_OFFICE', pdfData: dataUrl, entities: result.entities, fileName: file.name },
              resolve
            )
          })
          if (!isScanningEnabled()) {
            await dispatchFilePaste(el, dataUrl, file.name, file.type)
            return
          }
          if (resp && resp.ok && resp.redactedPdfData) {
            console.info(`[SecureGPT] Masked ${file.name}, re-injecting.`)
            ocrCache.set(resp.redactedPdfData, [])
            await dispatchFilePaste(el, resp.redactedPdfData, file.name, file.type)
            void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
            void logDetectionEvent({ ...result, hasFindings: true }, 'MASK', topEntity, false)
            return
          }
          console.error('[SecureGPT] Office masking failed — falling back to block')
        }

        showBanner('block', topEntity.category, result.entities.length)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'BLOCK', topEntity, false)
        return
      }

      let redactedUrl = dataUrl
      if (isPdf) {
        const resp = await new Promise<{ ok: boolean; redactedPdfData?: string }>((resolve) => {
          chrome.runtime.sendMessage({ type: 'REDACT_PDF', pdfData: dataUrl, entities: result.entities }, resolve)
        })
        if (!isScanningEnabled()) {
          await dispatchFilePaste(el, dataUrl, file.name, file.type)
          return
        }
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

      if (!isScanningEnabled()) {
        await dispatchFilePaste(el, dataUrl, file.name, file.type)
        return
      }
      ocrCache.set(redactedUrl, result.entities)

      if (action === 'MASK') {
        showBanner('mask', topEntity.category, result.entities.length)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'MASK', topEntity, false)
      } else if (action === 'WARN_ALLOW') {
        showBanner('warn', topEntity.category, result.entities.length)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'warn' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'WARN_ALLOW', topEntity, true)
      }

      await dispatchFilePaste(el, redactedUrl, file.name, file.type)
    } else {
      console.info(`[SecureGPT] ${file.name} is clean. Forwarding original.`)
      ocrCache.set(dataUrl, [])
      await dispatchFilePaste(el, dataUrl, file.name, file.type)
    }
  } catch (err) {
    console.error(`[SecureGPT] File scan error for ${file.name}:`, err)
    if (isOffice) {
      ocrCache.set(dataUrl, [])
      await dispatchFilePaste(el, dataUrl, file.name, file.type)
    }
  } finally {
    decPending()
    if (getPendingCount() === 0) removeBanner()
  }
}
