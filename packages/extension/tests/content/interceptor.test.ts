// ─────────────────────────────────────────────
// Interceptor Tests
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyMasking, previewMasking } from '@/features/actions/services/masking.service'
import type { PIIEntity } from '@securegpt/shared/types'

const mockEntity = (overrides: Partial<PIIEntity> = {}): PIIEntity => ({
  id: 'test-id',
  type: 'email',
  category: 'PII',
  value: 'john@example.com',
  maskedValue: '[EMAIL-REDACTED]',
  startIndex: 0,
  endIndex: 16,
  confidence: 0.99,
  severity: 'high',
  tier: 'regex',
  ...overrides,
})

describe('masking.service', () => {
  describe('applyMasking', () => {
    it('replaces a single entity correctly', () => {
      const text = 'Email: john@example.com please'
      const entities = [mockEntity({ startIndex: 7, endIndex: 23, value: 'john@example.com' })]
      const result = applyMasking(text, entities)
      expect(result).toBe('Email: [EMAIL-REDACTED] please')
    })

    it('replaces multiple entities in correct order', () => {
      const text = 'john@example.com and jane@example.com'
      const entities = [
        mockEntity({ startIndex: 0, endIndex: 16, value: 'john@example.com' }),
        mockEntity({ id: 'id2', startIndex: 21, endIndex: 37, value: 'jane@example.com' }),
      ]
      const result = applyMasking(text, entities)
      expect(result).toBe('[EMAIL-REDACTED] and [EMAIL-REDACTED]')
    })

    it('returns original text when no entities', () => {
      const text = 'Hello world'
      expect(applyMasking(text, [])).toBe(text)
    })

    it('handles entities at start and end of text', () => {
      const text = 'john@example.com'
      const entities = [mockEntity({ startIndex: 0, endIndex: 16, value: 'john@example.com' })]
      const result = applyMasking(text, entities)
      expect(result).toBe('[EMAIL-REDACTED]')
    })
  })

  describe('previewMasking', () => {
    it('produces correct diff structure', () => {
      const text = 'Email: john@example.com thanks'
      const entities = [mockEntity({ startIndex: 7, endIndex: 23, value: 'john@example.com' })]
      const { diff } = previewMasking(text, entities)

      expect(diff).toHaveLength(3)
      expect(diff[0]).toEqual({ text: 'Email: ', masked: false })
      expect(diff[1]).toEqual({ text: '[EMAIL-REDACTED]', masked: true })
      expect(diff[2]).toEqual({ text: ' thanks', masked: false })
    })

    it('returns masked text correctly', () => {
      const text = 'My email: test@test.com'
      const entities = [mockEntity({ startIndex: 10, endIndex: 23, value: 'test@test.com' })]
      const { masked } = previewMasking(text, entities)
      expect(masked).toBe('My email: [EMAIL-REDACTED]')
    })
  })
})
