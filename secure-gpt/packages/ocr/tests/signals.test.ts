import { describe, it, expect } from 'vitest'
import { classifyDocumentFuzzy, levenshteinDistance } from '../src/postprocessor/signals'

describe('Confidential Signals & Fuzzy Matching', () => {
  it('computes Levenshtein distance accurately', () => {
    expect(levenshteinDistance('confidential', 'confidential')).toBe(0)
    expect(levenshteinDistance('confidential', 'c0nfidential')).toBe(1)
    expect(levenshteinDistance('passport', 'passp0rt')).toBe(1)
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
  })

  it('classifies exact confidential signals', () => {
    const text = 'This document is RESTRICTED and proprietary.'
    const result = classifyDocumentFuzzy(text)
    expect(result.isConfidential).toBe(true)
    expect(result.severityFloor).toBe('high')
    expect(result.matchedSignals).toContain('restricted')
    expect(result.matchedSignals).toContain('proprietary')
  })

  it('classifies fuzzy typo signals in noisy OCR', () => {
    const noisyText = 'Header: C0NFIDENTIAL DRAFT - DO NOT SHARE'
    const result = classifyDocumentFuzzy(noisyText)
    expect(result.isConfidential).toBe(true)
    expect(result.severityFloor).toBe('high')
  })
})
