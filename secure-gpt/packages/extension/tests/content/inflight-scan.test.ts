import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
import { handleImagePasteInternal } from '../../src/content/file-scanner'
import { dispatchImagePaste } from '../../src/content/dom-utils'
import { applyImageMasking } from '../../src/features/actions/services/masking.service'

vi.mock('../../src/content/dom-utils', () => ({
  dispatchImagePaste: vi.fn(), dispatchFilePaste: vi.fn(), clearAttachments: vi.fn(),
}))
vi.mock('../../src/content/banners', () => ({ showBanner: vi.fn(), removeBanner: vi.fn() }))
vi.mock('../../src/content/audit-logger', () => ({ logDetectionEvent: vi.fn() }))
vi.mock('../../src/content/submit-handler', () => ({ getMostRestrictiveAction: vi.fn() }))
vi.mock('../../src/features/actions/services/masking.service', () => ({ applyImageMasking: vi.fn() }))

describe('in-flight document scanning', () => {
  it('forwards the original pasted image if scanning is disabled before OCR finishes', async () => {
    let enabled = true
    let respond: ((value: unknown) => void) | undefined
    ;(chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation((_message, callback) => {
      respond = callback as (value: unknown) => void
    })
    const editor = document.createElement('div')
    const cache = new Map()
    const scan = handleImagePasteInternal(
      editor, 'data:image/png;base64,original', DEFAULT_PII_CONFIG,
      cache, vi.fn(), vi.fn(), () => 0, () => enabled,
    )
    enabled = false
    respond?.({ hasFindings: true, entities: [{ category: 'PII', value: 'secret' }] })
    await scan

    expect(dispatchImagePaste).toHaveBeenCalledWith(editor, 'data:image/png;base64,original')
    expect(applyImageMasking).not.toHaveBeenCalled()
    expect(cache.size).toBe(0)
  })
})
