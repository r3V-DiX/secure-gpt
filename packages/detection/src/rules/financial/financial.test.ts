import { describe, it, expect, beforeAll } from 'vitest'
import { RegexTier } from '../../tiers/regex/regexTier'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

describe('Financial Rules', () => {
  let tier: RegexTier
  beforeAll(async () => {
    tier = new RegexTier()
    await tier.initialize()
  })

  it('credit_card (financial.credit_card)', async () => {
    const res = await tier.run('My card cvv is 4111111111111111.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'credit_card')).toBe(true)
  })

  it('upi_id (financial.upi_id)', async () => {
    const res = await tier.run('Pay via upi: anshul@okicici.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'upi_id')).toBe(true)
  })

  it('iban (financial.iban)', async () => {
    const res = await tier.run('My IBAN account is GB12ABCD345678901234.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'iban')).toBe(true)
  })

  it('ifsc_code (financial.ifsc_code)', async () => {
    const res = await tier.run('Bank IFSC is SBIN0001234.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'ifsc_code')).toBe(true)
  })

  it('pan_card (financial.pan_card)', async () => {
    const res = await tier.run('Tax ID PAN: ABCPE1234F.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'pan_card')).toBe(true)
  })

  it('gstin (financial.gstin)', async () => {
    const res = await tier.run('GSTIN: 27ABCDE1234F1Z5.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'gst_number')).toBe(true)
  })
})
