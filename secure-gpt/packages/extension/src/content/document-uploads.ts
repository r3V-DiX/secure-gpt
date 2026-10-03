import type { DocumentPhase, DocumentRequest, DocumentReply, DocumentScan, DocumentProgress, DocumentKind, PIIConfig } from '@securegpt/shared/types'
import { documentMasks, remainingDocumentWarnings } from '@securegpt/shared/types'
import { isOfficeFile, isMaskableOffice, MAX_OFFICE_SCAN_BYTES } from './file-scanner-utils'
import { attachChatGptFile, redactedFile, type AttachmentTarget } from './chatgpt-attachment'
import { renderDocumentUploads } from './document-upload-ui'

interface Upload {
  id: string; file: File; phase: DocumentPhase; target: AttachmentTarget
  controller: AbortController; policy?: PIIConfig | undefined; detail?: string | undefined; retryable: boolean
  warning?: (() => void) | undefined
  phaseStartedAt: number
  sensitive?: boolean
}
export function documentKind(file: File): DocumentKind | undefined {
  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(file.name)) return 'image'
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf'
  if (isOfficeFile(file)) return 'office'
}

export function documentMessage<T>(message: DocumentRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response: DocumentReply<T>) => {
        if (chrome.runtime.lastError || !response || response.ok !== true) {
          reject(new Error(response?.ok === false ? response.code : 'DOCUMENT_CONNECTION_LOST'))
        } else resolve(response.value)
      })
    } catch { reject(new Error('DOCUMENT_CONNECTION_LOST')) }
  })
}

function readFile(file: File, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const abort = () => reader.abort()
    reader.onloadend = () => signal.removeEventListener('abort', abort)
    reader.onerror = () => reject(new Error('DOCUMENT_READ_FAILED'))
    reader.onabort = () => reject(new Error('DOCUMENT_CANCELLED'))
    reader.onload = () => resolve(reader.result as string)
    signal.addEventListener('abort', abort, { once: true })
    reader.readAsDataURL(file)
  })
}

export class DocumentUploads {
  readonly jobs = new Map<string, Upload>()
  private attachQueue: Promise<unknown> = Promise.resolve()
  constructor(private readonly request = documentMessage, private readonly attach = attachChatGptFile,
    private readonly render = renderDocumentUploads) {}

  get unresolved(): boolean {
    return [...this.jobs.values()].some(job => job.phase !== 'completed' && job.phase !== 'cancelled')
  }

  add(file: File, target: AttachmentTarget, policy?: PIIConfig): void {
    const job: Upload = { id: crypto.randomUUID(), file, target, policy, phase: policy ? 'checking' : 'queued', controller: new AbortController(), retryable: true, phaseStartedAt: performance.now() }
    this.jobs.set(job.id, job)
    this.refresh()
    if (policy) void this.process(job)
  }

  configure(policy: PIIConfig | null): void {
    for (const job of this.jobs.values()) {
      if (job.policy) continue
      if (policy) { job.policy = policy; void this.process(job) }
      else void this.deliver(job, job.file)
    }
  }

  progress(message: DocumentProgress): void {
    const job = this.jobs.get(message.jobId)
    if (!job || job.controller.signal.aborted || job.policy?.version !== message.policyVersion) return
    if (message.phase !== job.phase && job.phase !== 'queued' && job.phase !== 'checking') return
    job.sensitive ||= message.sensitive === true
    this.update(job, message.phase, job.sensitive
      ? 'Sensitive information found—upload blocked while redacting.'
      : message.page ? `Checking document… Page ${message.page} of ${message.pages}. Upload held.` : undefined)
  }

  remove(id: string): void {
    const job = this.jobs.get(id)
    if (!job) return
    job.controller.abort()
    job.warning?.()
    this.cancelRemote(job)
    this.jobs.delete(id)
    this.refresh()
  }

  cancelAll(): void { for (const id of [...this.jobs.keys()]) this.remove(id) }

  private cancelRemote(job: Upload): void {
    if (job.policy) void this.request({ type: 'DOCUMENT_CANCEL', jobId: job.id, policyVersion: job.policy.version }).catch(() => undefined)
  }

  private refresh(): void {
    this.render([...this.jobs.values()], {
      remove: id => this.remove(id),
      retry: id => {
        const old = this.jobs.get(id)
        if (!old || old.phase !== 'failed' || !old.retryable) return
        this.remove(id)
        this.add(old.file, old.target, old.policy)
      },
      acknowledge: id => this.jobs.get(id)?.warning?.(),
    })
  }

  private update(job: Upload, phase: DocumentPhase, detail?: string): void {
    job.controller.signal.throwIfAborted()
    const now = performance.now()
    console.info('[SecureGPT document]', { jobId: job.id, stage: job.phase, durationMs: Math.round(now - job.phaseStartedAt), status: phase })
    job.phaseStartedAt = now
    job.phase = phase
    job.detail = detail
    this.refresh()
  }

  private async deliver(job: Upload, file: File): Promise<void> {
    const operation = this.attachQueue.then(async () => {
      this.update(job, 'attaching')
      job.retryable = false // Never repeat a dispatch whose outcome may be ambiguous.
      await this.attach(file, job.target, job.controller.signal)
      this.update(job, 'completed', file === job.file ? 'Document checked and attached.' : 'Sensitive information redacted. Safe replacement attached.')
    })
    this.attachQueue = operation.catch(() => undefined)
    try { await operation } catch (error) { this.fail(job, error) }
  }

  private fail(job: Upload, error: unknown): void {
    if (job.controller.signal.aborted) return
    const code = error instanceof Error ? error.message : 'DOCUMENT_FAILED'
    const safeCode = /^DOCUMENT_[A-Z_]+$/.test(code) ? code : 'DOCUMENT_FAILED'
    console.warn('[SecureGPT document]', { jobId: job.id, status: 'failed', code: safeCode })
    const reason = safeCode === 'DOCUMENT_TIMEOUT' ? 'Checking took too long.' :
      safeCode === 'DOCUMENT_TOO_LARGE' ? 'This file is too large to scan safely.' :
      /UNSUPPORTED|INCOMPLETE_EXTRACTION/.test(safeCode) ? 'This document contains a format or embedded content that cannot be fully checked.' :
      safeCode === 'DOCUMENT_UNREADABLE_IMAGE' ? 'The document text could not be read reliably.' : 'The document could not be safely processed.'
    const detail = !job.retryable
      ? 'Attachment could not be confirmed. Check ChatGPT and remove any partial attachment before removing this notice and trying again.'
      : `Upload blocked. ${reason} Retry or remove this file.`
    this.update(job, 'failed', detail)
    this.cancelRemote(job)
  }

  private async process(job: Upload): Promise<void> {
    const config = job.policy!
    const message = (type: DocumentRequest['type']): DocumentRequest => ({ type, jobId: job.id, policyVersion: config.version })
    try {
      const kind = documentKind(job.file)
      if (!kind) throw new Error('DOCUMENT_UNSUPPORTED')
      if (job.file.size > (kind === 'office' ? MAX_OFFICE_SCAN_BYTES : 50 * 1024 * 1024)) throw new Error('DOCUMENT_TOO_LARGE')
      this.update(job, 'checking')
      const dataUrl = await readFile(job.file, job.controller.signal)
      job.controller.signal.throwIfAborted()
      this.update(job, 'queued')
      const result = await this.request<DocumentScan>({ ...message('DOCUMENT_SCAN'), dataUrl, fileName: job.file.name, kind, config })
      job.controller.signal.throwIfAborted()
      if (!result || !Array.isArray(result.entities)) throw new Error('DOCUMENT_INVALID_RESPONSE')
      const masks = documentMasks(result.entities, config)
      const warnings = remainingDocumentWarnings(result.entities, masks, config)
      let safe = job.file
      if (masks.length) {
        this.update(job, 'redacting')
        if (kind === 'office' && !isMaskableOffice(job.file)) throw new Error('DOCUMENT_UNSUPPORTED_REDACTION')
        const redacted = await this.request<string>(message('DOCUMENT_REDACT'))
        job.controller.signal.throwIfAborted()
        if (!redacted || redacted === dataUrl) throw new Error('DOCUMENT_REDACTION_FAILED')
        safe = await redactedFile(job.file, redacted)
      }
      if (warnings.length) {
        this.update(job, 'awaiting-warning')
        await new Promise<void>(resolve => { job.warning = resolve })
        job.warning = undefined
      }
      job.controller.signal.throwIfAborted()
      await this.deliver(job, safe)
    } catch (error) { this.fail(job, error) }
    finally { this.cancelRemote(job) }
  }
}
