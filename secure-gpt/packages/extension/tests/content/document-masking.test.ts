import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyImageMasking } from '../../src/features/actions/services/masking.service'
import type { PIIEntity } from '@securegpt/shared/types'

const entity = (bboxes?: PIIEntity['bboxes']) => ({ id: 'synthetic', ...(bboxes ? { bboxes } : {}) } as PIIEntity)
afterEach(() => { vi.unstubAllGlobals() })
describe('strict image masking', () => {
  it('rejects if any selected finding has no redaction region', async () => {
    await expect(applyImageMasking('original', [entity([{ x0: 0, y0: 0, x1: 10, y1: 10 }]), entity()])).rejects.toThrow('DOCUMENT_MISSING_REDACTION_BOXES')
  })
  it('rejects a missing canvas instead of returning the original', async () => {
    vi.stubGlobal('Image', class {
      width = 100; height = 100; onload?: () => void
      set src(_value: string) { queueMicrotask(() => this.onload?.()) }
    })
    await expect(applyImageMasking('original', [entity([{ x0: 0, y0: 0, x1: 10, y1: 10 }])])).rejects.toThrow('DOCUMENT_CANVAS_UNAVAILABLE')
  })
  it('rejects canvas export failure instead of leaving the upload hanging', async () => {
    vi.stubGlobal('Image', class {
      width = 100; height = 100; onload?: () => void
      set src(_value: string) { queueMicrotask(() => this.onload?.()) }
    })
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue({ drawImage: vi.fn(), fillRect: vi.fn() } as any)
    vi.spyOn(canvas, 'toDataURL').mockImplementation(() => { throw new Error('export failed') })
    const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await expect(applyImageMasking('original', [entity([{ x0: 0, y0: 0, x1: 10, y1: 10 }])])).rejects.toThrow('DOCUMENT_REDACTION_FAILED')
    create.mockRestore()
  })
})
