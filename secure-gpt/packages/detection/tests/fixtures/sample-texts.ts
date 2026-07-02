// ─────────────────────────────────────────────
// Regex Tier Tests
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { RegexTier } from '../../src/tiers/regex/regexTier'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'


const tier = new RegexTier()

describe('RegexTier — financial', () => {
  it('detects valid Visa card (Luhn passes)', async () => {
    const entities = await tier.run('Card: 4532015112830366', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'credit_card')).toBe(true)
  })

  it('rejects invalid card number (Luhn fails)', async () => {
    const entities = await tier.run('Card: 4532015112830367', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'credit_card')).toBe(false)
  })

  it('detects PAN card', async () => {
    const entities = await tier.run('PAN: ABCPE1234F', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'pan_card')).toBe(true)
  })

  it('rejects invalid PAN format', async () => {
    const entities = await tier.run('PAN: 12345ABCDE', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'pan_card')).toBe(false)
  })

  it('detects GST number', async () => {
    const entities = await tier.run('GST: 27ABCDE1234F1Z5', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'gst_number')).toBe(true)
  })
})

describe('RegexTier — PII', () => {
  it('detects email', async () => {
    const entities = await tier.run('Email: user@domain.com', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'email')).toBe(true)
  })

  it('detects Indian phone number', async () => {
    const entities = await tier.run('Call me at +919876543210', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'phone')).toBe(true)
  })

  it('detects Aadhaar number', async () => {
    const entities = await tier.run('Aadhaar: 2234 5678 9012', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'aadhaar')).toBe(true)
  })

  it('detects US SSN', async () => {
    const entities = await tier.run('SSN: 123-45-6789', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'ssn')).toBe(true)
  })

  it('detects Indian passport', async () => {
    const entities = await tier.run('Passport: A1234567', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'passport')).toBe(true)
  })

  it('detects IP address', async () => {
    const entities = await tier.run('Server at 192.168.1.100', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'ip_address')).toBe(true)
  })
})

describe('RegexTier — confidential', () => {
  it('detects AWS access key', async () => {
    const entities = await tier.run('AKIAIOSFODNN7EXAMPLE', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'aws_key')).toBe(true)
  })

  it('detects GitHub PAT', async () => {
    const entities = await tier.run('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh12', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'github_pat')).toBe(true)
  })

  it('detects Google API key', async () => {
    const entities = await tier.run('key=AIzaSyD-9tSrke72I6e0DVObwJe0iQGP1234567', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'api_key')).toBe(true)
  })

  it('detects password in text', async () => {
    const entities = await tier.run('password=SuperSecret123', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'password')).toBe(true)
  })

  it('detects private key header', async () => {
    const entities = await tier.run('-----BEGIN RSA PRIVATE KEY-----', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'credentials')).toBe(true)
  })

  it('detects confidential label', async () => {
    const entities = await tier.run('CONFIDENTIAL: Do not share this document', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.type === 'credentials')).toBe(true)
  })
})

describe('RegexTier — IP', () => {
  it('detects M&A keywords', async () => {
    const entities = await tier.run('The merger with Acme Corp is pending due diligence', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.category === 'IP')).toBe(true)
  })

  it('detects roadmap keywords', async () => {
    const entities = await tier.run('Q3 launch of our new feature plan', DEFAULT_PII_CONFIG)
    expect(entities.some((e) => e.category === 'IP')).toBe(true)
  })
})

describe('RegexTier — deduplication', () => {
  it('does not return duplicate overlapping matches', async () => {
    const entities = await tier.run(
      'john.doe@example.com',
      DEFAULT_PII_CONFIG
    )
    const emails = entities.filter((e) => e.type === 'email')
    expect(emails).toHaveLength(1)
  })
})

describe('RegexTier — custom keywords', () => {
  it('detects org custom keywords', async () => {
    const config: PIIConfig = {
      ...DEFAULT_PII_CONFIG,
      categories: {
        ...DEFAULT_PII_CONFIG.categories,
        CONFIDENTIAL: {
          enabled: true,
          action: 'BLOCK',
          customKeywords: ['ProjectX', 'OperationBlue'],
          allowlist: [],
          fuzzyMatch: false,
          customRules: [],
        },
      },
    }
    const entities = await tier.run('Details about ProjectX are confidential', config)
    expect(entities.some((e) => e.type === 'credentials')).toBe(true)
  })
})
