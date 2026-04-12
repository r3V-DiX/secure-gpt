import { vi } from 'vitest'

// Mock chrome API
const chromeMock = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn((path) => `chrome-extension://mock/${path}`),
    id: 'mock-extension-id',
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
  },
}

global.chrome = chromeMock as any

// Mock TextEncoder/Decoder
global.TextEncoder = class {
  encode(text: string) {
    return new Uint8Array(Buffer.from(text))
  }
} as any

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(async () => {
        return new Uint8Array(32).buffer
      })
    },
    randomUUID: vi.fn(() => 'mock-uuid')
  },
  configurable: true
})
