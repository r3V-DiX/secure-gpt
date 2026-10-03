import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NERTier } from './nerTier'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

// Mock Worker
class MockWorker {
  onmessage: ((e: any) => void) | null = null
  private ready = false

  addEventListener = vi.fn((event, cb) => {
    if (event === 'message') {
      this.onmessage = cb
      if (!this.ready) {
        this.ready = true
        queueMicrotask(() => cb({ data: { type: 'READY' } }))
      }
    }
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
        tokens: ['[CLS]', 'john', '.', 'doe', '@', 'example', '.', 'com', '[SEP]', ...new Array(119).fill('[PAD]')],
        offsets: [[0, 0], [8, 12], [12, 13], [13, 16], [16, 17], [17, 24], [24, 25], [25, 28], [0, 0], ...new Array(119).fill([0, 0])]
      }))
    } as any
  })

  it('detects entities from mocked worker response', async () => {
    // Mock the global Worker for this test
    const mockWorker = new MockWorker()
    const OriginalWorker = global.Worker
    global.Worker = function() { return mockWorker; } as any

    await tier.initialize()

    const entities = await tier.run('Contact john.doe@example.com', DEFAULT_PII_CONFIG)
    
    expect(entities.length).toBeGreaterThan(0)
    expect(entities[0]!.type).toBe('B-EMAIL')
    expect(entities[0]!.category).toBe('PII')

    global.Worker = OriginalWorker
  })

  it('joins B/I wordpieces at their original offsets', () => {
    const spans = (tier as any).spansFromLabels(
      ['[CLS]', 'john', '##son', '[SEP]'],
      [[0, 0], [0, 4], [4, 7], [0, 0]],
      [54, 8, 35, 54],
      'Johnson',
    )
    expect(spans).toEqual([{ type: 'B-GIVENNAME1', value: 'Johnson', start: 0, end: 7 }])
  })

  it('rejects model spans that cut through a word or number', () => {
    const spans = (tier as any).spansFromLabels(
      ['[CLS]', '##lice', '[SEP]'],
      [[0, 0], [1, 5], [0, 0]],
      [54, 8, 54],
      'Alice',
    )
    expect(spans).toEqual([])
    const dateFragment = (tier as any).spansFromLabels(
      ['[CLS]', '-', '12', '[SEP]'],
      [[0, 0], [7, 8], [8, 10], [0, 0]],
      [54, 0, 27, 54],
      '1990-05-12',
    )
    expect(dateFragment).toEqual([])
  })
})
