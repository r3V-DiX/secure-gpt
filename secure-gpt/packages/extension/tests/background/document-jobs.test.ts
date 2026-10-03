import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
vi.mock('../../src/background/offscreen-proxy', () => ({ ensureOffscreenReady: async () => true }))
vi.mock('../../src/background/redaction-handler', () => ({ handleRedactOffice: vi.fn() }))
vi.mock('../../src/lib/storage/storage', () => ({
  policyStorage: { getPolicy: async () => DEFAULT_PII_CONFIG },
  stateStorage: { isActive: async () => true }, authStorage: { isLoggedIn: async () => true },
}))
import { handleDocumentRequest } from '../../src/background/document-jobs'

const sender = { tab: { id: 101 }, frameId: 0, documentId: 'test-document', url: 'https://chatgpt.com/', id: 'mock-extension-id' } as chrome.runtime.MessageSender
let sequence = 0
const request = () => ({ type: 'DOCUMENT_SCAN' as const, jobId: `background-${++sequence}`, policyVersion: DEFAULT_PII_CONFIG.version, kind: 'image' as const, dataUrl: 'data:image/png;base64,c3ludGhldGlj', fileName: 'synthetic.png' })
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(chrome.tabs.sendMessage).mockResolvedValue(undefined)
  vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(undefined)
})
describe('document background failures', () => {
  it('rejects missing offscreen responses', async () => {
    const result = await handleDocumentRequest(request(), sender)
    expect(result).toEqual({ ok: false, code: 'DOCUMENT_INVALID_RESPONSE' })
  })
  it('preserves explicit extraction errors', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue({ ok: false, code: 'DOCUMENT_SCAN_FAILED' })
    expect(await handleDocumentRequest(request(), sender)).toEqual({ ok: false, code: 'DOCUMENT_SCAN_FAILED' })
  })
  it('does not begin work cancelled before authorization finishes', async () => {
    const message = request()
    const pending = handleDocumentRequest(message, sender)
    await handleDocumentRequest({ ...message, type: 'DOCUMENT_CANCEL' }, sender)
    expect(await pending).toEqual({ ok: false, code: 'DOCUMENT_CANCELLED' })
    expect(vi.mocked(chrome.runtime.sendMessage).mock.calls.some(([message]) => (message as unknown as { action?: string })?.action === 'OFFSCREEN_DOCUMENT_SCAN')).toBe(false)
  })
})
