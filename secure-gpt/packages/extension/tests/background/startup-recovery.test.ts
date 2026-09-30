import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activateOpenTabs, activateTab } from '../../src/background/open-tab-activation'

vi.mock('../../src/background/open-tab-activation', () => ({
  activateOpenTabs: vi.fn().mockResolvedValue(undefined),
  activateTab: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../src/background/policy-sync', () => ({
  startPolicySync: vi.fn(), forcePolicySync: vi.fn(), LLM_URL_PATTERNS: [],
}))
vi.mock('../../src/background/log-batcher', () => ({
  startLogBatcher: vi.fn(), flushLogs: vi.fn(), queueLog: vi.fn(), scheduleRecoveryFlush: vi.fn(),
}))

describe('background tab recovery wiring', () => {
  let installed!: () => void
  let activated!: (info: { tabId: number }) => void

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.resetModules()
    vi.clearAllMocks()
    ;(chrome.runtime as any).onInstalled = { addListener: vi.fn((listener) => { installed = listener }) }
    ;(chrome.runtime as any).onStartup = { addListener: vi.fn() }
    ;(chrome.runtime as any).onSuspend = { addListener: vi.fn() }
    ;(chrome.tabs as any).onUpdated = { addListener: vi.fn() }
    ;(chrome.tabs as any).onActivated = { addListener: vi.fn((listener) => { activated = listener }) }
    await import('../../src/background/index')
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('scans existing tabs on installation and retries after Chrome settles', async () => {
    installed()
    await Promise.resolve()
    expect(activateOpenTabs).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1000)
    expect(activateOpenTabs).toHaveBeenCalledTimes(2)
  })

  it('recovers a tab when the user activates it', () => {
    activated({ tabId: 42 })
    expect(activateTab).toHaveBeenCalledWith(42)
  })
})
