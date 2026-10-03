// packages/extension/src/content/file-scanner.ts
// Handles file upload inspection (Images, PDFs, Office docs) and redaction

import { dispatchImagePaste, dispatchFilePaste } from './dom-utils'
import { showBanner, removeLoadingBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { logDetectionEvent } from './audit-logger'
import { applyImageMasking } from '@/features/actions/services/masking.service'
import { getMostRestrictiveAction } from './submit-handler'
import type { PIIConfig, DetectionResult, PIIEntity } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'
import {
  isOfficeFile,
  isMaskableOffice,
  MAX_OFFICE_SCAN_BYTES,
  sendMsgWithTimeout,
} from './file-scanner-utils'

export { isOfficeFile, isMaskableOffice, MAX_OFFICE_SCAN_BYTES }

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

    const res = await sendMsgWithTimeout<DetectionResult>({
      type: 'DETECT_PII_IMAGE',
      imgUrl,
      config: currentPolicy
    }, 20000)

    const result: DetectionResult = res || {
      hasFindings: false,
      entities: [],
      tier: 'ocr',
      processingTimeMs: 0,
      inputLength: 0
    }

    if (!isScanningEnabled()) {
      await dispatchImagePaste(el, imgUrl)
      return
    }

    if (result.hasFindings && result.entities.length > 0) {
      const { action, topEntity } = getMostRestrictiveAction(result.entities, currentPolicy)
      console.info(`[SecureGPT] OCR found ${result.entities.length} entities. Policy Action: ${action} (${topEntity.category})`)

      console.info(`[SecureGPT] Redacting ${result.entities.length} entities before prompt injection…`)
      const redactedUrl = await applyImageMasking(imgUrl, result.entities)
      if (!isScanningEnabled()) {
        await dispatchImagePaste(el, imgUrl)
        return
      }

      if (action === 'BLOCK') {
        ocrCache.set(redactedUrl, result.entities)
        const onBannerClick = () => showShieldModal(result, currentPolicy, 'Pasted Image', undefined, true, 'Image Upload Blocked')
        showBanner('block', topEntity.category, result.entities.length, undefined, onBannerClick)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'BLOCK', topEntity, false)
        await dispatchImagePaste(el, redactedUrl)
        showShieldModal(result, currentPolicy, 'Pasted Image', undefined, true, 'Image Upload Blocked')
        return
      }

      ocrCache.set(redactedUrl, [])

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
    if (getPendingCount() === 0) removeLoadingBanner()
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

    const msgType = isImage ? 'DETECT_PII_IMAGE' : isPdf ? 'DETECT_PII_PDF' : 'DETECT_PII_OFFICE'
    const res = await sendMsgWithTimeout<DetectionResult>(
      { type: msgType, imgUrl: dataUrl, pdfData: dataUrl, config: currentPolicy, fileName: file.name },
      25000
    )

    const result: DetectionResult = res || {
      hasFindings: false,
      entities: [],
      tier: 'ocr',
      processingTimeMs: 0,
      inputLength: 0
    }

    if (!isScanningEnabled()) {
      await dispatchFilePaste(el, dataUrl, file.name, file.type)
      return
    }

    if (result.hasFindings && result.entities.length > 0) {
      const { action, topEntity } = getMostRestrictiveAction(result.entities, currentPolicy)
      console.info(`[SecureGPT] Found ${result.entities.length} entities in ${file.name}. Policy Action: ${action} (${topEntity.category})`)

      let redactedUrl = dataUrl

      if (isOffice) {
        if (isMaskableOffice(file)) {
          const resp = await sendMsgWithTimeout<{ ok: boolean; redactedPdfData?: string }>(
            { type: 'REDACT_OFFICE', pdfData: dataUrl, entities: result.entities, fileName: file.name },
            7000
          )
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
            showBanner('mask', topEntity.category, result.entities.length)
            return
          }
        }
      } else if (isPdf) {
        const resp = await sendMsgWithTimeout<{ ok: boolean; redactedPdfData?: string }>(
          { type: 'REDACT_PDF', pdfData: dataUrl, entities: result.entities },
          8000
        )
        if (resp && resp.ok && resp.redactedPdfData) {
          redactedUrl = resp.redactedPdfData
        }
      } else {
        redactedUrl = await applyImageMasking(dataUrl, result.entities)
      }

      if (!isScanningEnabled()) {
        await dispatchFilePaste(el, dataUrl, file.name, file.type)
        return
      }

      const isRedactedPng = isPdf && redactedUrl.startsWith('data:image/png')
      const targetFileName = isRedactedPng ? file.name.replace(/\.pdf$/i, '.png') : file.name
      const targetMimeType = isRedactedPng ? 'image/png' : file.type

      console.info(`[SecureGPT] Dispatching redacted document (${targetFileName}) to prompt input...`)
      await dispatchFilePaste(el, redactedUrl, targetFileName, targetMimeType)

      if (action === 'BLOCK') {
        ocrCache.set(redactedUrl, result.entities)
        const onBannerClick = () => showShieldModal(result, currentPolicy, file.name, undefined, true, 'Document Upload Blocked')
        showBanner('block', topEntity.category, result.entities.length, undefined, onBannerClick)
        void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
        void logDetectionEvent({ ...result, hasFindings: true }, 'BLOCK', topEntity, false)
        showShieldModal(result, currentPolicy, file.name, undefined, true, 'Document Upload Blocked')
        return
      }

      ocrCache.set(redactedUrl, [])
      showBanner('mask', topEntity.category, result.entities.length)
      void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
      void logDetectionEvent({ ...result, hasFindings: true }, 'MASK', topEntity, false)
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
    if (getPendingCount() === 0) removeLoadingBanner()
  }
}
