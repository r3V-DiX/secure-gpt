// ─────────────────────────────────────────────
// Post-OCR Glyph Confusion & Checksum Recovery
// Resolves common OCR character misrecognitions via mathematical check digits and regex rules
// ─────────────────────────────────────────────

import { verhoeffCheck } from '@securegpt/shared/utils/detection-helpers'

export const validateVerhoeff = verhoeffCheck

export function validateLuhn(numStr: string): boolean {
  const clean = numStr.replace(/\D/g, '')
  if (clean.length < 13 || clean.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// Letter-to-Digit substitution mapping for positions that must be numeric
const CHAR_TO_DIGIT: Record<string, string> = {
  O: '0', o: '0', Q: '0', D: '0',
  I: '1', l: '1', '|': '1', '!': '1', i: '1',
  Z: '2', z: '2',
  E: '3',
  A: '4',
  S: '5', s: '5',
  G: '6', b: '6',
  T: '7',
  B: '8', '&': '8',
  g: '9', q: '9',
}

// Digit-to-Letter substitution mapping for positions that must be alphabetic
const DIGIT_TO_CHAR: Record<string, string> = {
  '0': 'O',
  '1': 'I',
  '2': 'Z',
  '3': 'E',
  '4': 'A',
  '5': 'S',
  '6': 'G',
  '7': 'T',
  '8': 'B',
  '9': 'P',
}

/**
 * Repairs a string expected to be numeric at target positions.
 */
export function repairToDigits(str: string): string {
  return str.split('').map((char) => CHAR_TO_DIGIT[char] || char).join('')
}

/**
 * Repairs a string expected to be uppercase alphabetic at target positions.
 */
export function repairToLetters(str: string): string {
  return str.split('').map((char) => DIGIT_TO_CHAR[char] || char).join('')
}

/**
 * Recovers potential PAN Card numbers from noisy OCR text.
 * Structure: 5 letters + 4 numbers + 1 letter (e.g. NCPPK7135A, ABCPE1234F)
 */
export function recoverPanNumbers(rawText: string): string[] {
  const candidates: Set<string> = new Set()
  // Matches potential 10-char alphanumeric tokens with optional intra-token spaces
  const regex = /\b([A-Za-z0-9]{5}\s*[A-Za-z0-9]{4}\s*[A-Za-z0-9])\b/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(rawText)) !== null) {
    const rawMatch = match[1]!.replace(/\s+/g, '')
    if (rawMatch.length === 10) {
      const p1 = repairToLetters(rawMatch.slice(0, 5).toUpperCase())
      const p2 = repairToDigits(rawMatch.slice(5, 9))
      const p3 = repairToLetters(rawMatch.slice(9, 10).toUpperCase())

      const repaired = `${p1}${p2}${p3}`
      if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(repaired)) {
        candidates.add(repaired)
      }
    }
  }

  return Array.from(candidates)
}

/**
 * Recovers potential 12-digit Aadhaar numbers using Verhoeff checksum validation.
 */
export function recoverAadhaarNumbers(rawText: string): string[] {
  const valid: Set<string> = new Set()
  // Matches 12-char alphanumeric sequences or 3 blocks of 4
  const regex = /\b([0-9A-Za-zIOlSGB]{4}\s*[0-9A-Za-zIOlSGB]{4}\s*[0-9A-Za-zIOlSGB]{4})\b/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(rawText)) !== null) {
    const rawMatch = match[1]!.replace(/\s+/g, '')
    if (rawMatch.length === 12) {
      const repaired = repairToDigits(rawMatch)
      if (/^[2-9][0-9]{11}$/.test(repaired) && validateVerhoeff(repaired)) {
        valid.add(repaired)
      }
    }
  }

  return Array.from(valid)
}

/**
 * Recovers Indian / International Passport numbers.
 * Structure: 1 uppercase letter + 7 numeric digits (e.g. Z9999999, K1234567).
 */
export function recoverPassportNumbers(rawText: string): string[] {
  const candidates: Set<string> = new Set()
  const regex = /\b([A-Za-z0-9]{1}\s*[0-9A-Za-zIOlSGB]{7})\b/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(rawText)) !== null) {
    const rawMatch = match[1]!.replace(/\s+/g, '')
    if (rawMatch.length === 8) {
      const letter = repairToLetters(rawMatch.slice(0, 1).toUpperCase())
      const digits = repairToDigits(rawMatch.slice(1, 8))
      const repaired = `${letter}${digits}`
      if (/^[A-Z][0-9]{7}$/.test(repaired)) {
        candidates.add(repaired)
      }
    }
  }

  // Also extract MRZ lines (e.g., P<IND... or passport number lines)
  const mrzRegex = /([A-Z0-9<]{8,9})<[0-9O]{1}[A-Z]{3}/g
  while ((match = mrzRegex.exec(rawText)) !== null) {
    const rawId = match[1]!.replace(/</g, '')
    if (rawId.length === 8) {
      const letter = repairToLetters(rawId.slice(0, 1).toUpperCase())
      const digits = repairToDigits(rawId.slice(1, 8))
      const repaired = `${letter}${digits}`
      if (/^[A-Z][0-9]{7}$/.test(repaired)) {
        candidates.add(repaired)
      }
    }
  }

  return Array.from(candidates)
}

/**
 * Recovers ABHA Health ID (e.g., 12-3456-7890-1234).
 */
export function recoverAbhaIds(rawText: string): string[] {
  const candidates: Set<string> = new Set()
  const regex = /\b([0-9A-Za-zIOlSGB]{2}[- ][0-9A-Za-zIOlSGB]{4}[- ][0-9A-Za-zIOlSGB]{4}[- ][0-9A-Za-zIOlSGB]{4})\b/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(rawText)) !== null) {
    const clean = match[1]!.replace(/\s/g, '-')
    const parts = clean.split('-').map((p) => repairToDigits(p))
    if (parts.length === 4 && parts[0]!.length === 2 && parts[1]!.length === 4 && parts[2]!.length === 4 && parts[3]!.length === 4) {
      candidates.add(parts.join('-'))
    }
  }

  return Array.from(candidates)
}

/**
 * Recovers 16-digit Credit Card numbers.
 */
export function recoverCreditCards(rawText: string): string[] {
  const candidates: Set<string> = new Set()
  const regex = /\b(?:\d[ -]*?){13,19}\b/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(rawText)) !== null) {
    const raw = match[0]!.replace(/\D/g, '')
    if ((raw.length === 15 || raw.length === 16) && validateLuhn(raw)) {
      candidates.add(raw)
    }
  }

  return Array.from(candidates)
}

/**
 * Full post-OCR text recovery pipeline that injects verified candidates into output.
 */
export function repairOcrText(rawText: string): string {
  let repaired = rawText

  const pans = recoverPanNumbers(rawText)
  for (const pan of pans) {
    if (!repaired.includes(pan)) repaired += `\n${pan}`
  }

  const aadhaars = recoverAadhaarNumbers(rawText)
  for (const aadhaar of aadhaars) {
    if (!repaired.includes(aadhaar)) repaired += `\n${aadhaar}`
  }

  const passports = recoverPassportNumbers(rawText)
  for (const passport of passports) {
    if (!repaired.includes(passport)) repaired += `\n${passport}`
  }

  const abhas = recoverAbhaIds(rawText)
  for (const abha of abhas) {
    if (!repaired.includes(abha)) repaired += `\n${abha}`
  }

  const ccs = recoverCreditCards(rawText)
  for (const cc of ccs) {
    if (!repaired.includes(cc)) repaired += `\n${cc}`
  }

  return repaired
}
