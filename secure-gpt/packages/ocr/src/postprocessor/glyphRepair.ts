// ─────────────────────────────────────────────
// Post-OCR Glyph Confusion & Checksum Recovery
// Resolves common OCR character misrecognitions via mathematical check digits
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
  I: '1', l: '1', '|': '1', '!': '1',
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
 * Structure: 5 letters + 4 numbers + 1 letter (e.g. ABCPE1234F)
 */
export function recoverPanNumbers(rawText: string): string[] {
  const candidates: string[] = []
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
        candidates.push(repaired)
      }
    }
  }

  return candidates
}

/**
 * Recovers potential 12-digit Aadhaar numbers using Verhoeff checksum validation.
 */
export function recoverAadhaarNumbers(rawText: string): string[] {
  const valid: string[] = []
  // Matches 12-char alphanumeric sequences or 3 blocks of 4
  const regex = /\b([0-9A-Za-zIOlSGB]{4}\s*[0-9A-Za-zIOlSGB]{4}\s*[0-9A-Za-zIOlSGB]{4})\b/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(rawText)) !== null) {
    const rawMatch = match[1]!.replace(/\s+/g, '')
    if (rawMatch.length === 12) {
      const repaired = repairToDigits(rawMatch)
      if (/^[2-9][0-9]{11}$/.test(repaired) && validateVerhoeff(repaired)) {
        valid.push(repaired)
      }
    }
  }

  return valid
}

/**
 * Full post-OCR text recovery pipeline that injects verified candidates into output.
 */
export function repairOcrText(rawText: string): string {
  let repaired = rawText

  // Recover PANs
  const pans = recoverPanNumbers(rawText)
  for (const pan of pans) {
    if (!repaired.includes(pan)) {
      repaired += `\n${pan}`
    }
  }

  // Recover Aadhaar
  const aadhaars = recoverAadhaarNumbers(rawText)
  for (const aadhaar of aadhaars) {
    if (!repaired.includes(aadhaar)) {
      repaired += `\n${aadhaar}`
    }
  }

  return repaired
}
