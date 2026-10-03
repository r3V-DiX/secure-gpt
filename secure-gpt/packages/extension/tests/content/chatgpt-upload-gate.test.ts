import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
const state = vi.hoisted(() => ({ unresolved: true, add: vi.fn(), configure: vi.fn(), cancelAll: vi.fn(), progress: vi.fn() }))
vi.mock('../../src/content/document-uploads', () => ({ DocumentUploads: class {
  get unresolved() { return state.unresolved }
  add = state.add; configure = state.configure; cancelAll = state.cancelAll; progress = state.progress
} }))
import { installChatGptUploadGate } from '../../src/content/chatgpt-upload-gate'
import { approvedUploadEvents } from '../../src/content/chatgpt-attachment'

describe('early ChatGPT upload gate', () => {
  let gate: ReturnType<typeof installChatGptUploadGate>
  let listeners: Map<string, EventListener>
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('location', { hostname: 'chatgpt.com', href: 'https://chatgpt.com/' })
    listeners = new Map()
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => { listeners.set(type, listener as EventListener) })
    gate = installChatGptUploadGate()
  })
  afterEach(() => { gate.dispose(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
  const files = [new File(['one'], 'one.png', { type: 'image/png' }), new File(['two'], 'two.pdf', { type: 'application/pdf' })]

  it.each(['paste', 'drop'])('holds all files from %s before policy retrieval completes', type => {
    const event = { type, isTrusted: true, clipboardData: { files }, dataTransfer: { files }, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() }
    listeners.get(type)!(event as unknown as Event)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(event.stopImmediatePropagation).toHaveBeenCalledOnce()
    expect(state.add).toHaveBeenCalledTimes(2)
  })
  it('captures file-input input events before a website input listener can upload the file', () => {
    const input = document.createElement('input'); input.type = 'file'
    Object.defineProperty(input, 'files', { value: files })
    const event = { type: 'input', target: input, isTrusted: true, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() }
    listeners.get('input')!(event as unknown as Event)
    expect(event.stopImmediatePropagation).toHaveBeenCalledOnce()
    expect(state.add).toHaveBeenCalledTimes(2)
  })
  it('does not intercept the one approved replacement event', () => {
    const event = new Event('change')
    approvedUploadEvents.add(event)
    listeners.get('change')!(event)
    expect(state.add).not.toHaveBeenCalled()
  })
  it('blocks Send synchronously without queuing an automatic send', () => {
    const button = document.createElement('button'); button.dataset.testid = 'send-button'
    const event = { type: 'click', target: button, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() }
    listeners.get('click')!(event as unknown as Event)
    expect(event.preventDefault).toHaveBeenCalledOnce()
  })
  it('invalidates held jobs when protection changes or navigation occurs', () => {
    gate.setPolicy(DEFAULT_PII_CONFIG)
    gate.setPolicy(null)
    expect(state.cancelAll).toHaveBeenCalledOnce()
    location.href = 'https://chatgpt.com/c/new'
    listeners.get('popstate')!(new Event('popstate'))
    expect(state.cancelAll).toHaveBeenCalledTimes(2)
  })
})
