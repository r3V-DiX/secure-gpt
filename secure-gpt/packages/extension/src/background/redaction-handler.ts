import type { PIIEntity } from '@securegpt/shared/types'
import { DASHBOARD_URL } from '@/config/api.config'
import apiClient from '@/lib/api/client'
import { ensureOffscreenReady, setupOffscreen } from './offscreen-proxy'

export async function handleRedactPDF(
  pdfData: string,
  entities: PIIEntity[],
  manualRegions: any[] = []
): Promise<{ ok: boolean; redactedPdfData?: string; error?: string }> {
  try {
    // 1. Try instant client-side offscreen canvas redaction
    try {
      const isReady = await ensureOffscreenReady()
      if (isReady) {
        const localResp = await chrome.runtime.sendMessage({
          action: 'OFFSCREEN_REDACT_PDF_LOCAL',
          data: { pdfData, entities },
        })
        if (localResp?.ok && localResp.redactedPdfData) {
          console.info('[Background] Client-side offscreen PDF redaction succeeded!')
          return { ok: true, redactedPdfData: localResp.redactedPdfData }
        }
      }
    } catch (localErr) {
      console.warn('[Background] Local offscreen PDF redaction fallback to backend:', localErr)
    }

    console.log('[Background] Sending PDF to backend for secure redaction...')

    const textValues = (entities || [])
      .filter((e: any) => !e.bboxes || e.bboxes.length === 0)
      .map((e: any) => e.value)

    let autoRegions: any[] = []
    if (textValues.length > 0) {
      console.debug('[Background] Mapping text values to coordinates via offscreen...')
      await setupOffscreen()

      const mappingResp = await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_GET_PDF_REGIONS',
        data: { values: textValues },
      })
      if (mappingResp?.ok && Array.isArray(mappingResp.regions) && mappingResp.regions.length > 0) {
        autoRegions = mappingResp.regions
      } else {
        console.warn('[Background] PDF region mapping returned empty — offscreen state may be stale')
      }
    }

    const entitiesWithBboxes = (entities || [])
      .filter((e: any) => e.bboxes && e.bboxes.length > 0)
      .flatMap((e: any) =>
        e.bboxes.map((b: any) => ({
          page: 0,
          x: b.x0,
          y: b.y0,
          width: b.x1 - b.x0,
          height: b.y1 - b.y0,
        }))
      )

    const regions = [...autoRegions, ...entitiesWithBboxes, ...manualRegions]
    const validRegions = regions.filter((r) => r.width > 0 && r.height > 0)

    const resp = await fetch(pdfData)
    const pdfBlob = await resp.blob()

    const formData = new FormData()
    formData.append('file', pdfBlob, 'document.pdf')
    console.info(`[Background] Sending ${validRegions.length} redaction regions to backend.`)
    formData.append('regions', JSON.stringify(validRegions))

    const backendResp = await apiClient.post<Blob>(
      `${DASHBOARD_URL}/api/v1/redact/pdf`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        timeout: 2500,
      }
    )

    const redactedBlob = backendResp.data
    const reader = new FileReader()
    const redactedDataUri = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(redactedBlob)
    })

    return { ok: true, redactedPdfData: redactedDataUri }
  } catch (err) {
    console.error('[Background] Backend Redaction failed:', err)
    return { ok: false, error: String(err) }
  }
}

export async function handleRedactOffice(
  fileData: string,
  entities: PIIEntity[],
  fileName?: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; redactedPdfData?: string; error?: string }> {
  try {
    console.log('[Background] Sending office document to backend for PII masking...')

    const entityPayload = [...new Map((entities || []).map(entity => [entity.value, entity])).values()].map((e) => ({
      value: e.value,
      maskedValue: e.maskedValue,
    }))

    const resp = await fetch(fileData)
    const fileBlob = await resp.blob()

    const formData = new FormData()
    formData.append('file', fileBlob, fileName || 'document.bin')
    formData.append('entities', JSON.stringify(entityPayload))

    const backendResp = await apiClient.post<Blob>(
      `${DASHBOARD_URL}/api/v1/redact/office`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        timeout: signal ? 0 : 30000,
        ...(signal ? { signal } : {}),
      }
    )

    const maskedBlob = backendResp.data
    const reader = new FileReader()
    const maskedDataUri = await new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error('DOCUMENT_OUTPUT_FAILED'))
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(maskedBlob)
    })

    return { ok: true, redactedPdfData: maskedDataUri }
  } catch (err) {
    console.error('[Background] Office masking failed')
    return { ok: false, error: 'DOCUMENT_OFFICE_REDACTION_FAILED' }
  }
}
