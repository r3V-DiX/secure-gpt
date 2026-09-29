import { describe, it, expect } from 'vitest'
import { RegexTier } from './regexTier'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

describe('RegexTier', () => {
  it('emits both names at their original offsets after an explicit label', async () => {
    const text = 'Invoice #1042\nBill to: Mira Shah\nContact: mira.shah@example.com'
    const entities = await new RegexTier().run(text, DEFAULT_PII_CONFIG)
    const names = entities.filter((entity) => entity.ruleId === 'pii.explicit_person_name')
    expect(names.map(({ value, startIndex, endIndex }) => ({ value, startIndex, endIndex }))).toEqual([
      { value: 'Mira', startIndex: 23, endIndex: 27 },
      { value: 'Shah', startIndex: 28, endIndex: 32 },
    ])
  })
})
