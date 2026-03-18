// ─────────────────────────────────────────────
// Test Setup
// ─────────────────────────────────────────────

import { vi } from 'vitest'

// Mock chrome APIs
const chromeMock = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({ version: '1.0.0' })),
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
  },
  tabs: {
    create: vi.fn(),
    query: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(),
  },
}

vi.stubGlobal('chrome', chromeMock)
