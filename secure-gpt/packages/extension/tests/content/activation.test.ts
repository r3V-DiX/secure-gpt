import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
import { setupInterceptor, teardown } from '../../src/content/interceptor'
import { initSiteDetectionIndicator, removeSiteDetectionIndicator } from '../../src/content/site-detection-indicator'
import { handleSubmit } from '../../src/content/submit-handler'

vi.mock('../../src/content/interceptor', () => ({ setupInterceptor: vi.fn(), teardown: vi.fn() }))
vi.mock('../../src/content/site-detection-indicator', () => ({
  initSiteDetectionIndicator: vi.fn(), removeSiteDetectionIndicator: vi.fn(),
}))
vi.mock('../../src/content/submit-handler', () => ({ handleSubmit: vi.fn(), isExtensionContextValid: () => true }))

type ContentGlobal = typeof globalThis & { __securegptContentState?: { dispose: () => void } }
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }

describe('content activation', () => {
  let listeners: Array<(message: { type: string; policy?: typeof DEFAULT_PII_CONFIG }) => void>
  let loggedIn: boolean
  let active: boolean
  let policy: typeof DEFAULT_PII_CONFIG
  let page: { href: string; hostname: string }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
    vi.clearAllMocks()
    delete (globalThis as ContentGlobal).__securegptContentState
    listeners = []
    loggedIn = false
    active = true
    policy = DEFAULT_PII_CONFIG
    page = { href: 'https://chatgpt.com/', hostname: 'chatgpt.com' }
    vi.stubGlobal('location', page)
    ;(chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mockImplementation(listener => listeners.push(listener))
    ;(chrome.storage as any).onChanged = { addListener: vi.fn() }
    ;(chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation((message, callback) => {
      if (message.type === 'GET_AUTH_STATE') callback({ isLoggedIn: loggedIn })
      if (message.type === 'GET_STATE') callback({ active })
      if (message.type === 'GET_POLICY') callback({ policy })
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('registers recovery while logged out and activates after login', async () => {
    await import('../../src/content/index')
    await flush()
    expect(listeners).toHaveLength(1)
    expect(setupInterceptor).not.toHaveBeenCalled()

    loggedIn = true
    listeners[0]!({ type: 'AUTH_SUCCESS' })
    await flush()
    expect(setupInterceptor).toHaveBeenCalledOnce()

    listeners[0]!({ type: 'POLICY_UPDATED', policy: { ...policy, monitoredPlatforms: [] } })
    await flush()
    expect(teardown).toHaveBeenCalled()
    expect(removeSiteDetectionIndicator).toHaveBeenCalled()
  })

  it('replaces its old listeners when injected again into an open tab', async () => {
    loggedIn = true
    await import('../../src/content/index')
    await flush()
    expect(setupInterceptor).toHaveBeenCalledOnce()

    vi.resetModules()
    await import('../../src/content/index')
    await flush()
    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledOnce()
    expect(teardown).toHaveBeenCalledOnce()
    expect(setupInterceptor).toHaveBeenCalledTimes(2)
  })

  it('stays inactive on Search and activates after AI Mode navigation', async () => {
    loggedIn = true
    page = { href: 'https://www.google.com/search?q=hello', hostname: 'www.google.com' }
    vi.stubGlobal('location', page)
    await import('../../src/content/index')
    await flush()
    expect(setupInterceptor).not.toHaveBeenCalled()

    page.href = 'https://www.google.com/search?q=hello&udm=50'
    await vi.advanceTimersByTimeAsync(500)
    expect(setupInterceptor).toHaveBeenCalledOnce()
    expect(initSiteDetectionIndicator).toHaveBeenCalledOnce()

    page.href = 'https://www.google.com/search?q=hello'
    await vi.advanceTimersByTimeAsync(500)
    expect(teardown).toHaveBeenCalled()
  })

  it('activates when a paused tab resumes through storage', async () => {
    loggedIn = true
    active = false
    let storageListener: (changes: Record<string, unknown>, area: string) => void = () => {}
    ;(chrome.storage as any).onChanged.addListener = vi.fn(listener => { storageListener = listener })
    await import('../../src/content/index')
    await flush()
    expect(setupInterceptor).not.toHaveBeenCalled()

    active = true
    storageListener({ isActive: true }, 'local')
    await flush()
    expect(setupInterceptor).toHaveBeenCalledOnce()
  })

  it('scans the first Search prompt only when the AI Mode control is chosen', async () => {
    loggedIn = true
    page = { href: 'https://www.google.com/', hostname: 'www.google.com' }
    vi.stubGlobal('location', page)
    const search = document.createElement('textarea')
    search.name = 'q'
    search.value = 'private prompt'
    const button = document.createElement('button')
    button.setAttribute('role', 'link')
    button.innerText = 'AI Mode'
    document.body.append(search, button)
    const addListener = vi.spyOn(window, 'addEventListener')
    await import('../../src/content/index')
    await flush()
    const clickHandler = addListener.mock.calls.find(([type]) => type === 'click')?.[1] as (event: MouseEvent) => void
    const event = { isTrusted: true, target: button, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() } as unknown as MouseEvent

    clickHandler(event)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(handleSubmit).toHaveBeenCalledWith(search, expect.objectContaining({ entryPlatform: 'google-ai-mode' }))
    expect(setupInterceptor).not.toHaveBeenCalled()
    search.remove()
    button.remove()
    addListener.mockRestore()
  })
})
