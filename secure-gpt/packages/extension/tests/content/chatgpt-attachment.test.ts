import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { attachChatGptFile, approvedUploadEvents } from '../../src/content/chatgpt-attachment'

describe('ChatGPT attachment acceptance', () => {
  const file = new File(['safe'], 'sample.redacted.png', { type: 'image/png' })
  const controller = () => new AbortController()
  const target = () => ({ url: location.href })
  function confirm() {
    const chip = document.createElement('div')
    chip.dataset.testid = 'attachment'
    chip.textContent = file.name
    document.querySelector('form')!.append(chip)
  }
  beforeEach(() => {
    document.body.innerHTML = '<form><textarea id="mobile-composer-prompt"></textarea><input type="file" accept="image/*" id="photos"><input type="file" id="octane-mobile-composer-files-input"></form><input type="file" id="outside">'
  })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

  it('chooses the mobile composer file input once, with an approved event', async () => {
    const events: Event[] = []
    document.querySelectorAll('input').forEach(input => input.addEventListener('change', event => { events.push(event); confirm() }))
    await attachChatGptFile(file, target(), controller().signal)
    expect(events).toHaveLength(1)
    expect((events[0]!.target as HTMLElement).id).toBe('octane-mobile-composer-files-input')
    expect(approvedUploadEvents.has(events[0]!)).toBe(true)
  })
  it('prefers the captured input and never broadcasts a paste or drop', async () => {
    const input = document.querySelector<HTMLInputElement>('#photos')!
    const paste = vi.fn(); const drop = vi.fn()
    document.addEventListener('paste', paste, { once: true })
    document.addEventListener('drop', drop, { once: true })
    input.addEventListener('change', confirm, { once: true })
    await attachChatGptFile(file, { ...target(), input }, controller().signal)
    expect(paste).not.toHaveBeenCalled(); expect(drop).not.toHaveBeenCalled()
  })
  it('uses one paste only when no composer input exists', async () => {
    document.querySelectorAll('form input').forEach(input => input.remove())
    const paste = vi.fn(confirm)
    document.querySelector('textarea')!.addEventListener('paste', paste)
    await attachChatGptFile(file, target(), controller().signal)
    expect(paste).toHaveBeenCalledOnce()
  })
  it('keeps an ambiguous handoff blocked despite an unrelated remove button', async () => {
    vi.useFakeTimers()
    const changed = vi.fn(() => {
      const button = document.createElement('button'); button.setAttribute('aria-label', 'Remove attachment')
      document.querySelector('form')!.append(button)
    })
    document.querySelector('#octane-mobile-composer-files-input')!.addEventListener('change', changed)
    const result = attachChatGptFile(file, target(), controller().signal)
    const rejected = expect(result).rejects.toThrow('DOCUMENT_ATTACHMENT_UNCONFIRMED')
    await vi.advanceTimersByTimeAsync(10_000)
    await rejected
    expect(changed).toHaveBeenCalledOnce()
  })
  it('does not dispatch after cancellation', async () => {
    const abort = controller(); abort.abort()
    const changed = vi.fn(); document.querySelector('form')!.addEventListener('change', changed)
    await expect(attachChatGptFile(file, target(), abort.signal)).rejects.toThrow()
    expect(changed).not.toHaveBeenCalled()
  })
})
