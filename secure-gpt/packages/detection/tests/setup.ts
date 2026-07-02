import { vi } from 'vitest'

// Mock Worker
class MockWorker {
  onmessage: ((e: any) => void) | null = null
  onmessageerror: ((e: any) => void) | null = null
  onerror: ((e: any) => void) | null = null

  addEventListener = vi.fn((event, cb) => {
    if (event === 'message') {
      this.onmessage = cb
      // Auto-send READY message when listener is attached
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: { type: 'READY' } } as any)
        }
      }, 0)
    }
  })

  removeEventListener = vi.fn()

  postMessage = vi.fn((msg) => {
    // Basic auto-responder for NER
    if (msg.type === 'INFER') {
      const predictions = new Array(msg.maxSeqLen || 128).fill(54) // 'O' label
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({
            data: { type: 'RESULT', id: msg.id, predictions }
          } as any)
        }
      }, 10)
    }
  })
  
  terminate = vi.fn()
}

// Mock global Worker if it's missing (Node environment)
if (typeof global.Worker === 'undefined') {
  (global as any).Worker = MockWorker
}

// Mock URL and URL.createObjectURL
if (typeof global.URL === 'undefined' || !global.URL.createObjectURL) {
  const OriginalURL = global.URL || class { constructor(_path: string) {} };
  (global as any).URL = class extends (OriginalURL as any) {
    static createObjectURL = vi.fn(() => 'blob:test')
    static revokeObjectURL = vi.fn()
  }
}

// Mock crypto.randomUUID
if (typeof global.crypto === 'undefined' || !global.crypto.randomUUID) {
  (global as any).crypto = {
    ...(global.crypto || {}),
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2)
  }
}

// Mock performance.now
if (typeof global.performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now()
  }
}

// Mock tesseract.js to avoid real OCR initialization in tests
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => ({
    loadLanguage: vi.fn(),
    initialize: vi.fn(),
    setParameters: vi.fn(),
    recognize: vi.fn(async () => ({
      data: { text: '', words: [] }
    })),
    terminate: vi.fn()
  })),
  PSM: {
    AUTO: '3',
    SINGLE_BLOCK: '6',
    SPARSE_TEXT: '11'
  }
}))
