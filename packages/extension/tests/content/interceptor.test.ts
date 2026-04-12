import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupInterceptor } from '../../src/content/interceptor'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

describe('Interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('setupInterceptor attaches global listeners', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    
    setupInterceptor(DEFAULT_PII_CONFIG)

    // keydown, click, submit, paste, change, drop
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function), true)
    expect(addSpy).toHaveBeenCalledWith('submit', expect.any(Function), true)
    expect(addSpy).toHaveBeenCalledWith('paste', expect.any(Function), true)
    expect(addSpy).toHaveBeenCalledWith('change', expect.any(Function), true)
    expect(addSpy).toHaveBeenCalledWith('drop', expect.any(Function), true)
  })
})
