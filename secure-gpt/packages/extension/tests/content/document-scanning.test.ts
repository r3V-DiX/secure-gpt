import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
import { handleGlobalPaste, handleGlobalFileChange, handleGlobalDrop } from '../../src/content/file-drop-listener'

const policy = { ...DEFAULT_PII_CONFIG, enableDocumentScanning: false }
const context = {
  getCurrentPolicy: () => policy,
  isProtectionActive: () => true,
  ocrCache: new Map(),
  incPending: vi.fn(),
  decPending: vi.fn(),
  getPendingCount: () => 0,
}

describe('document scanning policy', () => {
  beforeEach(() => { vi.clearAllMocks() })
  it('lets pasted screenshots pass to the site when scanning is off', () => {
    const file = new File(['image'], 'screenshot.png', { type: 'image/png' })
    const event = {
      isTrusted: true,
      clipboardData: { items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }] },
      preventDefault: vi.fn(),
      stopImmediatePropagation: vi.fn(),
    } as unknown as ClipboardEvent

    handleGlobalPaste(event, context)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(event.stopImmediatePropagation).not.toHaveBeenCalled()
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled()
  })

  it('lets PDF file inputs and drops pass to the site when scanning is off', () => {
    const file = new File(['pdf'], 'report.pdf', { type: 'application/pdf' })
    const input = document.createElement('input')
    input.type = 'file'
    Object.defineProperty(input, 'files', { value: [file] })
    const change = { isTrusted: true, target: input, stopImmediatePropagation: vi.fn() } as unknown as Event
    const drop = {
      isTrusted: true,
      dataTransfer: { files: [file] },
      preventDefault: vi.fn(),
      stopImmediatePropagation: vi.fn(),
    } as unknown as DragEvent

    handleGlobalFileChange(change, context)
    handleGlobalDrop(drop, context)
    expect(change.stopImmediatePropagation).not.toHaveBeenCalled()
    expect(drop.preventDefault).not.toHaveBeenCalled()
    expect(drop.stopImmediatePropagation).not.toHaveBeenCalled()
  })
})
