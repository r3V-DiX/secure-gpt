import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_PII_CONFIG, type DocumentRequest, type DocumentEntity } from '@securegpt/shared/types'
vi.mock('../../src/offscreen/document-pdf', () => ({ DocumentPdf: class {} }))
vi.mock('../../src/offscreen/pdf-service', () => ({ dataUrlToUint8Array: async (value: string) => new Uint8Array(Buffer.from(value.split(',')[1]!, 'base64')) }))
vi.mock('@securegpt/detection', () => ({ detectPII: async () => ({ entities: [], hasFindings: false }), detectPIIFromImage: vi.fn() }))
import { scanDocument, cancelDocument, verifyOfficeDocument } from '../../src/offscreen/document-processor'

const source = 'data:text/csv;base64,cHJpdmF0ZQ=='
const safe = 'data:text/csv;base64,c2FmZQ=='
const request: DocumentRequest = { type: 'DOCUMENT_SCAN', jobId: 'test', policyVersion: 1, kind: 'office', fileName: 'report.csv', dataUrl: source }
const entities = [{ value: 'private' } as DocumentEntity]
describe('offscreen document lifecycle', () => {
  it('rejects work cancelled before its scan message arrives', async () => {
    cancelDocument('cancel-first')
    const extract = vi.fn()
    expect(await scanDocument('cancel-first', request, DEFAULT_PII_CONFIG, extract)).toEqual({ ok: false, code: 'DOCUMENT_CANCELLED' })
    expect(extract).not.toHaveBeenCalled()
  })
  it('rejects empty extraction', async () => {
    expect(await scanDocument('empty', request, DEFAULT_PII_CONFIG, async () => ({ ok: true, text: '' }))).toEqual({ ok: false, code: 'DOCUMENT_EXTRACTION_FAILED' })
  })
  it('verifies Office replacements and rejects unchanged or still-sensitive output', async () => {
    await scanDocument('office', request, DEFAULT_PII_CONFIG, async () => ({ ok: true, text: 'private' }))
    const extract = vi.fn(async () => ({ ok: true, text: 'private' }))
    expect((await verifyOfficeDocument('office', source, 'report.csv', entities, extract)).ok).toBe(false)
    expect((await verifyOfficeDocument('office', safe, 'report.csv', entities, extract)).ok).toBe(false)
    extract.mockResolvedValue({ ok: true, text: '[REDACTED]' })
    expect((await verifyOfficeDocument('office', safe, 'report.csv', entities, extract)).ok).toBe(true)
    cancelDocument('office')
    expect((await verifyOfficeDocument('office', safe, 'report.csv', entities, extract)).ok).toBe(false)
  })
})
