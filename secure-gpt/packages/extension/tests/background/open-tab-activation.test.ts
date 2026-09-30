import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activateOpenTabs, activateTab } from '../../src/background/open-tab-activation'

vi.mock('../../src/background/policy-sync', () => ({
  LLM_URL_PATTERNS: ['https://chatgpt.com/*'],
}))

describe('activation on already-open tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(chrome as any).scripting = { executeScript: vi.fn().mockResolvedValue([]) }
    ;(chrome.tabs as any).get = vi.fn()
  })

  it('injects into tabs missing the content script and skips tabs that respond', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 1, url: 'https://chatgpt.com/' },
      { id: 2, url: 'https://chatgpt.com/c/example' },
    ] as chrome.tabs.Tab[])
    vi.mocked(chrome.tabs.sendMessage).mockImplementation((id) => id === 1
      ? Promise.reject(new Error('No receiving end'))
      : Promise.resolve({ ready: true }))

    await activateOpenTabs()

    expect(chrome.tabs.query).toHaveBeenCalledWith({ url: ['https://chatgpt.com/*'] })
    expect(chrome.scripting.executeScript).toHaveBeenCalledOnce()
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 1 }, files: ['content/index.js'], injectImmediately: true,
    })
  })

  it('recovers an activated ChatGPT tab but ignores unsupported tabs', async () => {
    ;(chrome.tabs as any).get = vi.fn().mockResolvedValue({ url: 'https://chatgpt.com/c/example' })
    vi.mocked(chrome.tabs.sendMessage).mockRejectedValue(new Error('No receiving end'))

    await activateTab(9)
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 9 }, files: ['content/index.js'], injectImmediately: true,
    })

    await activateTab(10, 'https://example.com/')
    expect(chrome.scripting.executeScript).toHaveBeenCalledOnce()
  })

  it('reinserts the script when a stale listener reports that it is not ready', async () => {
    vi.mocked(chrome.tabs.sendMessage).mockResolvedValue({ ready: false })
    await activateTab(11, 'https://chatgpt.com/')
    expect(chrome.scripting.executeScript).toHaveBeenCalledOnce()
  })
})
