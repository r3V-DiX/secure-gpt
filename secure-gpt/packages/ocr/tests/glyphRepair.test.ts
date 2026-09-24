import { describe, it, expect } from 'vitest'
import {
  validateVerhoeff,
  validateLuhn,
  recoverPanNumbers,
  recoverAadhaarNumbers,
  repairOcrText,
} from '../src/postprocessor/glyphRepair'

describe('Post-OCR Glyph Repair & Checksums', () => {
  it('validates Verhoeff checksum correctly', () => {
    // Standard valid Aadhaar check number
    expect(validateVerhoeff('759229028107')).toBe(true)
    // Invalid check number
    expect(validateVerhoeff('759229028108')).toBe(false)
    expect(validateVerhoeff('123456789012')).toBe(false)
  })

  it('validates Luhn checksum correctly for credit cards', () => {
    // 4111 1111 1111 1111 is standard Luhn valid test Visa
    expect(validateLuhn('4111111111111111')).toBe(true)
    expect(validateLuhn('4111111111111112')).toBe(false)
  })

  it('recovers noisy PAN cards with glyph substitution', () => {
    // Noisy OCR output where 'O' was read as '0' in letter part and 'S' as '5' in number part
    const noisyPan1 = 'Card number: ABCPEI234F is registered' // 'I' instead of '1'
    const pans = recoverPanNumbers(noisyPan1)
    expect(pans).toContain('ABCPE1234F')

    const noisyPan2 = 'PAN: AB0PE1234F' // '0' in place of 'O'
    const pans2 = recoverPanNumbers(noisyPan2)
    expect(pans2).toContain('ABOPE1234F')
  })

  it('recovers noisy Aadhaar cards with Verhoeff validation', () => {
    // 7592 2902 8107 with OCR letter confusion 'O' instead of '0', 'l' instead of '1', 'S' instead of '5'
    const noisyAadhaar = 'UIDAI No: 7S92 29O2 8lO7'
    const recovered = recoverAadhaarNumbers(noisyAadhaar)
    expect(recovered).toContain('759229028107')
  })

  it('repairs full OCR raw text stream', () => {
    const rawOcr = 'GOVERNMENT OF INDIA\nIncome Tax Department\nPAN: ABCPEI234F\nAadhaar: 7S92 29O2 8lO7'
    const repaired = repairOcrText(rawOcr)

    expect(repaired).toContain('ABCPE1234F')
    expect(repaired).toContain('759229028107')
  })
})
