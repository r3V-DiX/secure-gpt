// @vitest-environment node
// Mirrors the OFFSCREEN_RUN_OFFICE path: anydoc-wasm extracts office-doc text,
// then the detection pipeline (regex → NER) scans it for PII. anydoc is
// synchronous and wasm-pack's node bindings use the named `initSync`.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { initSync, formatFromBytes, toMarkdownBytes } from '@firecrawl/anydoc-wasm'

const WASM_PATH = fileURLToPath(new URL('../../../../node_modules/@firecrawl/anydoc-wasm/anydoc_wasm_bg.wasm', import.meta.url))
const FIXTURE = fileURLToPath(new URL('../fixtures/pii.docx', import.meta.url))

// Minimal Worker stub (mirrors packages/detection/tests/setup.ts) so the NER
// worker round-trips and the full pipeline completes under node.
class MockWorker {
  onmessage: ((e: any) => void) | null = null
  addEventListener = vi.fn((event: string, cb: any) => {
    if (event === 'message') {
      this.onmessage = cb
      setTimeout(() => this.onmessage?.({ data: { type: 'READY' } } as any), 0)
    }
  })
  removeEventListener = vi.fn()
  postMessage = vi.fn((msg: any) => {
    if (msg.type === 'INFER') {
      const predictions = new Array(msg.maxSeqLen || 128).fill(54) // 'O' label
      setTimeout(() => this.onmessage?.({ data: { type: 'RESULT', id: msg.id, predictions } } as any), 10)
    }
  })
  terminate = vi.fn()
}

let detectPII: Awaited<typeof import('@securegpt/detection')>['detectPII']
let DEFAULT_PII_CONFIG: any

beforeAll(async () => {
  if (typeof global.Worker === 'undefined') (global as any).Worker = MockWorker
  initSync({ module: readFileSync(WASM_PATH) })
  const det = await import('@securegpt/detection')
  detectPII = det.detectPII
  DEFAULT_PII_CONFIG = (await import('@securegpt/shared/types')).DEFAULT_PII_CONFIG
})

describe('office-doc extraction + detection chain', () => {
  it('detects the docx format from content', () => {
    const bytes = new Uint8Array(readFileSync(FIXTURE))
    expect(formatFromBytes(bytes)).toBe('docx')
  })

  it('extracts text with anydoc and finds PAN + card PII', async () => {
    const bytes = new Uint8Array(readFileSync(FIXTURE))
    const markdown = toMarkdownBytes(bytes)

    expect(markdown).toContain('ABCDE1234F')
    expect(markdown).toContain('4111111111111111')

    const result = await detectPII(markdown, DEFAULT_PII_CONFIG)
    expect(result.hasFindings).toBe(true)
    const types = new Set(result.entities.map((e: any) => e.type))
    expect(types.has('pan_card')).toBe(true)
    expect(types.has('credit_card')).toBe(true)
  })
})
