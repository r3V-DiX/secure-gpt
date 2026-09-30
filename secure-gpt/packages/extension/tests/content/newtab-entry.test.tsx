import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_EXTENSION_CONFIG } from '../../src/config/defaults.config'
import { handleSubmit } from '../../src/content/submit-handler'
import { authStorage, policyStorage, stateStorage } from '../../src/lib/storage/storage'
import { NewTab } from '../../src/newtab/NewTabPage'

vi.mock('../../src/lib/storage/storage', () => ({
  authStorage: { isLoggedIn: vi.fn() },
  stateStorage: { isActive: vi.fn() },
  policyStorage: { getPolicy: vi.fn() },
}))
vi.mock('../../src/content/submit-handler', () => ({ handleSubmit: vi.fn() }))

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }

describe('protected New Tab AI Mode entry', () => {
  let root: Root
  let storageChanged: (changes: Record<string, chrome.storage.StorageChange>, area: string) => void
  let themeChanged: () => void
  let dark = false

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    vi.mocked(authStorage.isLoggedIn).mockResolvedValue(true)
    vi.mocked(stateStorage.isActive).mockResolvedValue(true)
    vi.mocked(policyStorage.getPolicy).mockResolvedValue(DEFAULT_EXTENSION_CONFIG)
    vi.mocked(handleSubmit).mockResolvedValue()
    dark = false
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      get matches() { return dark },
      addEventListener: vi.fn((_event, listener) => { themeChanged = listener }),
      removeEventListener: vi.fn(),
    })))
    ;(chrome.storage as any).onChanged = {
      addListener: vi.fn((listener) => { storageChanged = listener }),
      removeListener: vi.fn(),
    }
    document.documentElement.classList.remove('dark')
    document.body.innerHTML = '<div id="root"></div>'
    root = createRoot(document.getElementById('root')!)
    await act(async () => { root.render(createElement(NewTab)); await flush() })
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    vi.unstubAllGlobals()
  })

  it('uses shared controls and 16 px prompt text', () => {
    const input = document.querySelector<HTMLTextAreaElement>('#prompt')!
    expect(input.className).toContain('text-base')
    expect(input.className).toContain('bg-[var(--bg-surface)]')
    expect(document.querySelector('.newtab-card')).toBeTruthy()
    expect(document.querySelector<HTMLButtonElement>('#ai-mode')?.className).toContain('bg-[var(--accent)]')
  })

  it('checks an AI Mode prompt before allowing navigation', async () => {
    let finishScan!: () => void
    vi.mocked(handleSubmit).mockImplementation(() => new Promise<void>(resolve => { finishScan = resolve }))
    const input = document.querySelector<HTMLTextAreaElement>('#prompt')!
    const button = document.querySelector<HTMLButtonElement>('#ai-mode')!
    input.value = 'private example'
    await act(async () => { button.click(); await flush() })

    expect(handleSubmit).toHaveBeenCalledWith(input, expect.objectContaining({ entryPlatform: 'google-ai-mode' }))
    expect(button.disabled).toBe(true)
    await act(async () => { finishScan(); await flush() })
    expect(button.disabled).toBe(false)
  })

  it('does not run AI detection for ordinary Search', async () => {
    document.querySelector<HTMLTextAreaElement>('#prompt')!.value = 'hello'
    await act(async () => {
      document.querySelector<HTMLFormElement>('#search-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('uses Enter for Search and Ctrl+Enter for protected AI Mode', async () => {
    const input = document.querySelector<HTMLTextAreaElement>('#prompt')!
    const form = document.querySelector<HTMLFormElement>('#search-form')!
    const submit = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})
    input.value = 'example question'

    const searchKey = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    await act(async () => { input.dispatchEvent(searchKey) })
    expect(searchKey.defaultPrevented).toBe(true)
    expect(submit).toHaveBeenCalledOnce()
    expect(handleSubmit).not.toHaveBeenCalled()

    const aiKey = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true })
    await act(async () => { input.dispatchEvent(aiKey); await flush() })
    expect(aiKey.defaultPrevented).toBe(true)
    expect(handleSubmit).toHaveBeenCalledWith(input, expect.objectContaining({ entryPlatform: 'google-ai-mode' }))
    expect(submit).toHaveBeenCalledOnce()
  })

  it('keeps Shift+Enter available for a new line', async () => {
    const input = document.querySelector<HTMLTextAreaElement>('#prompt')!
    const key = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true })
    await act(async () => { input.dispatchEvent(key) })
    expect(key.defaultPrevented).toBe(false)
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('updates its theme when the device setting changes', async () => {
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    dark = true
    await act(async () => { themeChanged() })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    dark = false
    await act(async () => { themeChanged() })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('refreshes its policy status when storage changes', async () => {
    expect(document.querySelector('#status')?.textContent).toContain('checked')
    vi.mocked(policyStorage.getPolicy).mockResolvedValue({
      ...DEFAULT_EXTENSION_CONFIG,
      monitoredPlatforms: DEFAULT_EXTENSION_CONFIG.monitoredPlatforms.filter(platform => platform !== 'google-ai-mode'),
    })
    await act(async () => { storageChanged({ policy: { newValue: {} } }, 'local'); await flush() })
    expect(document.querySelector('#status')?.textContent).toContain('off in your policy')
    document.querySelector<HTMLTextAreaElement>('#prompt')!.value = 'example question'
    await act(async () => { document.querySelector<HTMLButtonElement>('#ai-mode')!.click(); await flush() })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('updates its status after login and pause changes', async () => {
    vi.mocked(authStorage.isLoggedIn).mockResolvedValue(false)
    await act(async () => { storageChanged({ auth: { newValue: null } }, 'local'); await flush() })
    expect(document.querySelector('#status')?.textContent).toContain('Sign in')

    vi.mocked(authStorage.isLoggedIn).mockResolvedValue(true)
    vi.mocked(stateStorage.isActive).mockResolvedValue(false)
    await act(async () => { storageChanged({ isActive: { newValue: false } }, 'local'); await flush() })
    expect(document.querySelector('#status')?.textContent).toContain('paused')

    vi.mocked(stateStorage.isActive).mockResolvedValue(true)
    await act(async () => { storageChanged({ isActive: { newValue: true } }, 'local'); await flush() })
    expect(document.querySelector('#status')?.textContent).toContain('checked')
  })
})
