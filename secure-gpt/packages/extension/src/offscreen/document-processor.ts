import { detectPII, detectPIIFromImage } from '@securegpt/detection'
import type { DocumentRequest, DocumentReply, DocumentScan, DocumentEntity, PIIConfig } from '@securegpt/shared/types'
import { documentMasks } from '@securegpt/shared/types'
import { DocumentPdf } from './document-pdf'
import { applyImageMasking } from '@/features/actions/services/masking.service'
import { dataUrlToUint8Array } from './pdf-service'
import { validateImageSource, validateOfficeSource } from './document-source'

interface Session { controller: AbortController; source: string; pdf?: DocumentPdf; kind: DocumentRequest['kind'] }
const sessions = new Map<string, Session>()
const cancelled = new Set<string>()

export function cancelDocument(key: string): void {
  cancelled.add(key)
  setTimeout(() => cancelled.delete(key), 300_000)
  const session = sessions.get(key)
  session?.controller.abort()
  session?.pdf?.dispose()
  sessions.delete(key)
}

export async function scanDocument(key: string, request: DocumentRequest, config: PIIConfig,
  office: (data: string, name?: string) => Promise<{ ok: boolean; text?: string; error?: string }>): Promise<DocumentReply<DocumentScan>> {
  if (cancelled.has(key)) return { ok: false, code: 'DOCUMENT_CANCELLED' }
  const session: Session = { controller: new AbortController(), source: request.dataUrl!, kind: request.kind }
  sessions.set(key, session)
  const { signal } = session.controller
  const onFindings = (entities: DocumentEntity[]) => {
    if (!signal.aborted && documentMasks(entities, config).length) {
      void chrome.runtime.sendMessage({ type: 'DOCUMENT_OFFSCREEN_PROGRESS', key, sensitive: true }).catch(() => undefined)
    }
  }
  const text = (value: string, policy: PIIConfig) => detectPII(value, policy, { strict: true, signal, onFindings })
  const image = (value: string, policy: PIIConfig) => detectPIIFromImage(value, policy, { strict: true, signal, onFindings })
  try {
    const bytes = await dataUrlToUint8Array(session.source)
    signal.throwIfAborted()
    let result: DocumentScan
    if (request.kind === 'pdf') {
      session.pdf = new DocumentPdf()
      result = await session.pdf.scan(session.source, config, signal, text, image, (page, pages, sensitive) => {
        void chrome.runtime.sendMessage({ type: 'DOCUMENT_OFFSCREEN_PROGRESS', key, page, pages, sensitive }).catch(() => undefined)
      })
    } else if (request.kind === 'image') {
      validateImageSource(bytes)
      result = await image(session.source, config)
    } else if (request.kind === 'office') {
      validateOfficeSource(bytes, request.fileName ?? '')
      const extracted = await office(session.source, request.fileName)
      if (!extracted.ok || !extracted.text?.trim()) throw new Error('DOCUMENT_EXTRACTION_FAILED')
      result = await text(extracted.text, config)
    } else throw new Error('DOCUMENT_UNSUPPORTED')
    signal.throwIfAborted()
    return { ok: true, value: result }
  } catch (error) {
    cancelDocument(key)
    return { ok: false, code: error instanceof Error && /^DOCUMENT_[A-Z_]+$/.test(error.message) ? error.message : 'DOCUMENT_SCAN_FAILED' }
  }
}

export async function redactDocument(key: string, entities: DocumentEntity[]): Promise<DocumentReply<string>> {
  const session = sessions.get(key)
  if (!session) return { ok: false, code: 'DOCUMENT_SESSION_LOST' }
  try {
    session.controller.signal.throwIfAborted()
    const value = session.pdf
      ? await session.pdf.redact(entities, session.controller.signal)
      : await applyImageMasking(session.source, entities)
    session.controller.signal.throwIfAborted()
    return { ok: true, value }
  } catch {
    return { ok: false, code: 'DOCUMENT_REDACTION_FAILED' }
  }
}

export async function verifyOfficeDocument(key: string, dataUrl: string, fileName: string, entities: DocumentEntity[],
  extract: (data: string, name?: string) => Promise<{ ok: boolean; text?: string; error?: string }>): Promise<DocumentReply<null>> {
  const session = sessions.get(key)
  if (!session || session.kind !== 'office') return { ok: false, code: 'DOCUMENT_SESSION_LOST' }
  try {
    session.controller.signal.throwIfAborted()
    if (dataUrl === session.source) throw new Error('DOCUMENT_REDACTION_FAILED')
    validateOfficeSource(await dataUrlToUint8Array(dataUrl), fileName)
    const result = await extract(dataUrl, fileName)
    const normalized = (text: string) => text.replace(/\s+/g, '').toLowerCase()
    if (!result.ok || !result.text?.trim() || entities.some(entity => normalized(result.text!).includes(normalized(entity.value)))) {
      throw new Error('DOCUMENT_OFFICE_VERIFICATION_FAILED')
    }
    session.controller.signal.throwIfAborted()
    return { ok: true, value: null }
  } catch { return { ok: false, code: 'DOCUMENT_OFFICE_VERIFICATION_FAILED' } }
}
