import { afterEach, describe, expect, it, vi } from 'vitest'
import { NERTier } from '@securegpt/ner'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
import { detectPII } from '../src/pipeline'

afterEach(() => { vi.unstubAllGlobals() })
describe('strict document detection', () => {
  it('rejects an incomplete inference instead of returning clean', async () => {
    class WorkerStub extends EventTarget {
      constructor() { super(); queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: { type: 'READY' } }))) }
      postMessage(message: { id: number }) { queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: { type: 'RESULT', id: message.id, predictions: [] } }))) }
      terminate() {}
    }
    vi.stubGlobal('Worker', WorkerStub)
    await expect(new NERTier().run('This is private document text.', DEFAULT_PII_CONFIG, true)).rejects.toThrow('NER_INFERENCE_FAILED')
  })
  it('can cancel initialization using the document deadline and retry', async () => {
    const terminate = vi.fn()
    class WorkerStub extends EventTarget { terminate = terminate }
    vi.stubGlobal('Worker', WorkerStub)
    const ner = new NERTier()
    const controller = new AbortController()
    const pending = ner.run('Private document.', DEFAULT_PII_CONFIG, true, controller.signal)
    const rejected = expect(pending).rejects.toThrow('NER_CANCELLED')
    await new Promise(resolve => setTimeout(resolve, 10))
    controller.abort()
    await rejected
    expect(terminate).toHaveBeenCalled()
  })
  it('retains overlapping rules for per-finding policy resolution', async () => {
    const result = await detectPII('Card number: 371449635398431', DEFAULT_PII_CONFIG, { strict: true })
    expect(result.entities.some(entity => entity.type === 'credit_card')).toBe(true)
    expect(result.entities.filter(entity => entity.value.includes('371449635398431')).length).toBeGreaterThan(1)
  })
})
