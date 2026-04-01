import { describe, it, expect, beforeAll } from 'vitest'
import { RegexTier } from '../../tiers/regex/regexTier'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

describe('IP Rules', () => {
  let tier: RegexTier
  beforeAll(async () => {
    tier = new RegexTier()
    await tier.initialize()
  })

  it('roadmap_keywords', async () => {
    const res = await tier.run('Confidential Roadmap for Q2 2025', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'proprietary')).toBe(true)
  })

  it('ma_keywords', async () => {
    const res = await tier.run('Target Project Alpha Merger details are highly sensitive', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'proprietary')).toBe(true)
  })
})
