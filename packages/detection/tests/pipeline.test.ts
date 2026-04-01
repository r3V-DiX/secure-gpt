// ─────────────────────────────────────────────
// Pipeline Tests
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { detectPII } from '../src/pipeline'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

describe('detectPII — pipeline', () => {
  it('returns no findings for clean text', async () => {
    const result = await detectPII('Hello how are you today?', DEFAULT_PII_CONFIG)
    expect(result.hasFindings).toBe(false)
    expect(result.entities).toHaveLength(0)
  })

  it('detects email address', async () => {
    const result = await detectPII(
      'Please contact john.doe@example.com for details.',
      DEFAULT_PII_CONFIG
    )
    expect(result.hasFindings).toBe(true)
    expect(result.entities[0]?.type).toBe('email')
    expect(result.entities[0]?.value).toBe('john.doe@example.com')
  })

  it('detects PAN card number', async () => {
    const result = await detectPII(
      'My PAN card is ABCPE1234F.',
      DEFAULT_PII_CONFIG
    )
    expect(result.hasFindings).toBe(true)
    expect(result.entities[0]?.type).toBe('pan_card')
  })

  it('detects Aadhaar number', async () => {
    const result = await detectPII(
      'My Aadhaar number is 7592 2902 8107',
      DEFAULT_PII_CONFIG
    )
    expect(result.hasFindings).toBe(true)
    expect(result.entities[0]?.type).toBe('aadhaar')
  })

  it('detects AWS access key', async () => {
    const result = await detectPII(
      'AWS Key: AKIAIOSFODNN7EXAMPLE',
      DEFAULT_PII_CONFIG
    )
    expect(result.hasFindings).toBe(true)
    expect(result.entities[0]?.type).toBe('aws_key')
  })

  it('detects JWT token', async () => {
    const result = await detectPII(
      'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      DEFAULT_PII_CONFIG
    )
    expect(result.hasFindings).toBe(true)
    expect(result.entities[0]?.type).toBe('jwt_token')
  })

  it('respects disabled category', async () => {
    const config = {
      ...DEFAULT_PII_CONFIG,
      categories: {
        ...DEFAULT_PII_CONFIG.categories,
        PII: { ...DEFAULT_PII_CONFIG.categories.PII, enabled: false },
      },
    }
    const result = await detectPII(
      'Email: test@example.com',
      config
    )
    expect(result.hasFindings).toBe(false)
  })

  it('respects allowlist', async () => {
    const config = {
      ...DEFAULT_PII_CONFIG,
      categories: {
        ...DEFAULT_PII_CONFIG.categories,
        PII: {
          ...DEFAULT_PII_CONFIG.categories.PII,
          allowlist: ['example.com'],
        },
      },
    }
    const result = await detectPII(
      'Email: test@example.com',
      config
    )
    expect(result.hasFindings).toBe(false)
  })

  it('returns processing time', async () => {
    const result = await detectPII('test text', DEFAULT_PII_CONFIG)
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('handles empty string', async () => {
    const result = await detectPII('', DEFAULT_PII_CONFIG)
    expect(result.hasFindings).toBe(false)
  })

  it('detects multiple entities in one text', async () => {
    const result = await detectPII(
      'Contact john@example.com or call +919876543210. PAN: ABCPE1234F',
      DEFAULT_PII_CONFIG
    )
    expect(result.entities.length).toBeGreaterThanOrEqual(2)
  })

})
