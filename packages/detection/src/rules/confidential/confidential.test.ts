import { describe, it, expect, beforeAll } from 'vitest'
import { RegexTier } from '../../tiers/regex/regexTier'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

describe('Confidential Rules', () => {
  let tier: RegexTier
  beforeAll(async () => {
    tier = new RegexTier()
    await tier.initialize()
  })

  it('aws_access_key', async () => {
    const res = await tier.run('AKIAIOSFODNN7EXAMPLE', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'aws_key')).toBe(true)
  })

  it('aws_secret_key', async () => {
    const res = await tier.run('aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'aws_key')).toBe(true)
  })

  it('stripe', async () => {
    const res = await tier.run('sk_live_1234567890abcdefghijklmn', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'api_key')).toBe(true)
  })

  it('github_pat', async () => {
    const res = await tier.run('ghp_1234567890abcdefghijklmnopqrstuvwxyz', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'github_pat')).toBe(true)
  })

  it('jwt_token', async () => {
    const res = await tier.run('Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'jwt_token')).toBe(true)
  })

  it('generic_api_key', async () => {
    const res = await tier.run('api_key="aabbccddeeffgghhiijjkkllmmnnoopp"', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'api_key')).toBe(true)
  })

  it('private_key', async () => {
    const res = await tier.run('-----BEGIN RSA PRIVATE KEY-----', DEFAULT_PII_CONFIG)
    expect(res.some(e => e.type === 'credentials')).toBe(true)
  })
})
