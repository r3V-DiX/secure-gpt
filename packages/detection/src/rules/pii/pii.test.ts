import { describe, it, expect, beforeAll } from 'vitest'
import { RegexTier } from '../../tiers/regex/regexTier'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

describe('PII Rules', () => {
  let tier: RegexTier
  beforeAll(async () => {
    tier = new RegexTier()
    await tier.initialize()
  })

  it('aadhaar (pii.aadhaar)', async () => {
    const res = await tier.run('My aadhaar is 7592 2902 8107.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'aadhaar')).toBe(true)
  })

  it('ssn (pii.us_ssn)', async () => {
    const res = await tier.run('My ssn is 123-45-6789.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'ssn')).toBe(true)
  })

  it('passport (pii.passport_in)', async () => {
    const res = await tier.run('Passport no is K1234567.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'passport')).toBe(true)
  })

  it('indian_dl (pii.indian_dl)', async () => {
    const res = await tier.run('DL no is DL 13 2011 0123456.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'national_id')).toBe(true)
  })

  it('voter_id (pii.voter_id)', async () => {
    const res = await tier.run('Election card: ABC1234567.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'national_id')).toBe(true)
  })

  it('email (pii.email)', async () => {
    const res = await tier.run('Email: john@example.com.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'email')).toBe(true)
  })

  it('phone_global (pii.phone_global) - Indian', async () => {
    const res = await tier.run('Call me on +91 9876543210.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'phone')).toBe(true)
  })

  it('phone_global (pii.phone_global) - US', async () => {
    const res = await tier.run('Contact me at (202) 456-1111.', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'phone')).toBe(true)
  })

  it('abha_id (pii.abha_id)', async () => {
    const res = await tier.run('Health ID: 12-3456-7890-1234.', DEFAULT_PII_CONFIG)
    if (!res.some(e => e.type === 'medical')) console.log('FAILED ABHA:', JSON.stringify(res))
    expect(res.some(e => e.type === 'medical')).toBe(true)
  })

  it('date_of_birth (pii.date_of_birth)', async () => {
    const res = await tier.run('My dob is 01/01/1990.', DEFAULT_PII_CONFIG)
    if (!res.some(e => e.type === 'date_of_birth')) console.log('FAILED DOB:', JSON.stringify(res))
    expect(res.some(e => e.type === 'date_of_birth')).toBe(true)
  })
})
