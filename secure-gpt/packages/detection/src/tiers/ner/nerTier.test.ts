import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NERTier } from './nerTier'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

// Mock Worker
class MockWorker {
  onmessage: ((e: any) => void) | null = null

  addEventListener = vi.fn((event, cb) => {
    if (event === 'message') this.onmessage = cb
  })

  removeEventListener = vi.fn()

  postMessage = vi.fn((msg) => {
    if (msg.type === 'INFER') {
      const predictions = new Array(128).fill(54)
      predictions[1] = 6
      predictions[2] = 33
      predictions[3] = 33

      const event = {
        data: { type: 'RESULT', id: msg.id, predictions }
      }

      // ✅ Support BOTH styles
      if (this.onmessage) this.onmessage(event)
    }
  })
}

// Mock crypto
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {
    randomUUID: () => 'test-uuid'
  }
}

// Mock URL and Worker globally
global.Worker = MockWorker as any
global.URL = class {
  constructor(_path: string) {}
} as any

describe('NERTier', () => {
  let tier: NERTier

  beforeEach(() => {
    tier = new NERTier()
    // Mock vocabRaw import
    // @ts-ignore
    tier['tokenizer'] = {
      tokenize: vi.fn((_text) => ({
        inputIds: new BigInt64Array(128),
        attentionMask: new BigInt64Array(128),
        tokenTypeIds: new BigInt64Array(128),
        tokens: ['[CLS]', 'john', '.', 'doe', '@', 'example', '.', 'com', '[SEP]', ...new Array(119).fill('[PAD]')]
      }))
    } as any
  })

  it('detects entities from mocked worker response', async () => {
    // Mock the global Worker for this test
    const mockWorker = new MockWorker()
    const OriginalWorker = global.Worker
    global.Worker = function() { return mockWorker; } as any

    // Mock ready message
    setTimeout(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({ data: { type: 'READY' } } as any)
      }
    }, 0)

    await tier.initialize()

    const entities = await tier.run('Contact john.doe@example.com', DEFAULT_PII_CONFIG)
    
    expect(entities.length).toBeGreaterThan(0)
    expect(entities[0]!.type).toBe('B-EMAIL')
    expect(entities[0]!.category).toBe('PII')

    global.Worker = OriginalWorker
  })
})
