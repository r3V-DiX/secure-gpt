import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentUploads, documentMessage } from '../../src/content/document-uploads'
import { DEFAULT_PII_CONFIG, type DocumentScan, type PIIConfig, type PIIEntity } from '@securegpt/shared/types'

vi.mock('../../src/content/chatgpt-attachment', () => ({
  attachChatGptFile: vi.fn(),
  redactedFile: async (original: File) => new File(['redacted'], original.name + '.redacted.png', { type: 'image/png' }),
}))
const entity = (action: string): PIIEntity => ({ id: action, ruleId: action, type: 'email', label: 'Email', category: 'PII', value: 'fake@example.test', maskedValue: '[REDACTED]', startIndex: 0, endIndex: 17, confidence: 1, severity: 'high', tier: 'ocr', bboxes: [{ x0: 0, y0: 0, x1: 10, y1: 10 }] })
const policy: PIIConfig = { ...DEFAULT_PII_CONFIG, categories: { ...DEFAULT_PII_CONFIG.categories, PII: { ...DEFAULT_PII_CONFIG.categories.PII, enabled: true, action: 'BLOCK', ruleOverrides: { warn: { action: 'WARN_ALLOW' }, allow: { action: 'ALLOW' } } } } }
const scan = (entities: PIIEntity[] = []): DocumentScan => ({ hasFindings: !!entities.length, entities, tier: 'ocr', processingTimeMs: 1, inputLength: 20 })
const file = () => new File(['original'], 'fixture.png', { type: 'image/png' })
const target = { url: 'https://chatgpt.com/' }
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setTimeout(resolve, 0)) }

describe('document upload lifecycle', () => {
  let uploads: DocumentUploads
  let request: ReturnType<typeof vi.fn<any[], Promise<any>>>
  let attach: ReturnType<typeof vi.fn<any[], Promise<void>>>
  let render: ReturnType<typeof vi.fn<any[], void>>
  beforeEach(() => {
    let id = 0
    vi.mocked(crypto.randomUUID).mockImplementation(() => `job-${++id}` as ReturnType<typeof crypto.randomUUID>)
    request = vi.fn(async message => message.type === 'DOCUMENT_CANCEL' ? null : scan())
    attach = vi.fn<any[], Promise<void>>(async () => undefined)
    render = vi.fn()
    uploads = new DocumentUploads(request, attach, render)
  })
  afterEach(() => uploads.cancelAll())

  it('holds the file synchronously and shows checking before file reading or detection', async () => {
    uploads.add(file(), target, policy)
    expect(uploads.unresolved).toBe(true)
    expect(render).toHaveBeenCalled()
    expect(attach).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
    await flush()
    expect(attach).toHaveBeenCalledOnce()
    expect(uploads.unresolved).toBe(false)
  })
  it('shows sensitive feedback while the remainder of a scan is still pending', async () => {
    request.mockImplementation(async message => message.type === 'DOCUMENT_SCAN' ? new Promise(() => undefined) : null)
    uploads.add(file(), target, policy)
    await flush()
    const job = [...uploads.jobs.values()][0]!
    uploads.progress({ type: 'DOCUMENT_PROGRESS', jobId: job.id, policyVersion: policy.version, phase: 'checking', sensitive: true })
    expect(job.detail).toContain('upload blocked while redacting')
    expect(attach).not.toHaveBeenCalled()
  })

  it('shows blocked/redacting before redaction resolves, and allows only the replacement', async () => {
    let finish!: (value: string) => void
    request.mockImplementation(async message => message.type === 'DOCUMENT_SCAN' ? scan([entity('block')]) :
      message.type === 'DOCUMENT_REDACT' ? new Promise(resolve => { finish = resolve }) : null)
    uploads.add(file(), target, policy)
    await flush()
    expect([...uploads.jobs.values()][0]?.phase).toBe('redacting')
    expect(attach).not.toHaveBeenCalled()
    finish('data:image/png;base64,c2FmZQ==')
    await flush()
    expect(attach).toHaveBeenCalledOnce()
    expect(attach.mock.calls[0]![0].name).toContain('.redacted')
    expect(uploads.unresolved).toBe(false)
  })

  it.each(['DOCUMENT_TIMEOUT', 'DOCUMENT_SCAN_FAILED', 'DOCUMENT_CONNECTION_LOST', 'DOCUMENT_MISSING_REDACTION_BOXES'])('never releases originals on %s', async code => {
    request.mockRejectedValue(new Error(code))
    uploads.add(file(), target, policy)
    await flush()
    expect(attach).not.toHaveBeenCalled()
    expect([...uploads.jobs.values()][0]?.phase).toBe('failed')
    expect(uploads.unresolved).toBe(true)
  })

  it('waits for acknowledgement of WARN_ALLOW findings even after other findings are redacted', async () => {
    request.mockImplementation(async message => message.type === 'DOCUMENT_SCAN' ? scan([entity('block'), { ...entity('warn'), bboxes: [{ x0: 20, y0: 20, x1: 30, y1: 30 }] }]) : 'data:image/png;base64,c2FmZQ==')
    uploads.add(file(), target, policy)
    await flush()
    const job = [...uploads.jobs.values()][0]!
    expect(job.phase).toBe('awaiting-warning')
    expect(attach).not.toHaveBeenCalled()
    render.mock.calls.at(-1)![1].acknowledge(job.id)
    await flush()
    expect(attach).toHaveBeenCalledOnce()
  })
  it('does not warn again for a finding completely covered by a successful mask', async () => {
    request.mockImplementation(async message => message.type === 'DOCUMENT_SCAN' ? scan([entity('block'), entity('warn')]) : 'data:image/png;base64,c2FmZQ==')
    uploads.add(file(), target, policy)
    await flush()
    expect(attach).toHaveBeenCalledOnce()
    expect(uploads.unresolved).toBe(false)
  })

  it('preserves ALLOW findings without redacting', async () => {
    request.mockResolvedValue(scan([entity('allow')]))
    const original = file()
    uploads.add(original, target, policy)
    await flush()
    expect(attach.mock.calls[0]![0]).toBe(original)
    expect(request.mock.calls.some(([message]) => message.type === 'DOCUMENT_REDACT')).toBe(false)
  })

  it('ignores late scan completion after removal', async () => {
    let finish!: (value: DocumentScan) => void
    request.mockImplementation(async message => message.type === 'DOCUMENT_SCAN' ? new Promise(resolve => { finish = resolve }) : null)
    uploads.add(file(), target, policy)
    await flush()
    uploads.remove([...uploads.jobs.keys()][0]!)
    finish(scan())
    await flush()
    expect(attach).not.toHaveBeenCalled()
    expect(uploads.unresolved).toBe(false)
  })

  it('keeps failed jobs blocked but processes every other selected file', async () => {
    request.mockImplementation(async message => {
      if (message.type === 'DOCUMENT_SCAN' && message.jobId === 'job-1') throw new Error('DOCUMENT_SCAN_FAILED')
      return scan()
    })
    uploads.add(file(), target, policy)
    uploads.add(file(), target, policy)
    await flush()
    expect(uploads.jobs.size).toBe(2)
    expect(attach).toHaveBeenCalledOnce()
    expect(uploads.unresolved).toBe(true)
  })

  it('does not retry an ambiguous attachment handoff', async () => {
    attach.mockRejectedValue(new Error('DOCUMENT_ATTACHMENT_UNCONFIRMED'))
    uploads.add(file(), target, policy)
    await flush()
    const job = [...uploads.jobs.values()][0]!
    expect(job.retryable).toBe(false)
    render.mock.calls.at(-1)![1].retry(job.id)
    await flush()
    expect(attach).toHaveBeenCalledOnce()
    expect(uploads.unresolved).toBe(true)
  })
  it('creates a new job for Retry without releasing the failed original', async () => {
    request.mockRejectedValueOnce(new Error('DOCUMENT_SCAN_FAILED'))
    uploads.add(file(), target, policy)
    await flush()
    const old = [...uploads.jobs.values()][0]!
    render.mock.calls.at(-1)![1].retry(old.id)
    await flush()
    expect(uploads.jobs.has(old.id)).toBe(false)
    expect(attach).toHaveBeenCalledOnce()
    expect(uploads.unresolved).toBe(false)
  })
  it('never attaches a redaction response after removal', async () => {
    let finish!: (value: string) => void
    request.mockImplementation(async message => message.type === 'DOCUMENT_SCAN' ? scan([entity('block')]) :
      message.type === 'DOCUMENT_REDACT' ? new Promise(resolve => { finish = resolve }) : null)
    uploads.add(file(), target, policy)
    await flush()
    uploads.cancelAll()
    finish('data:image/png;base64,c2FmZQ==')
    await flush()
    expect(attach).not.toHaveBeenCalled()
  })

  it('rejects absent runtime responses rather than treating them as clean', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockImplementation((_message, callback: any) => callback(undefined))
    await expect(documentMessage({ type: 'DOCUMENT_SCAN', jobId: 'missing', policyVersion: 1 })).rejects.toThrow('DOCUMENT_CONNECTION_LOST')
  })
})
