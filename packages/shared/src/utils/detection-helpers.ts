// ─────────────────────────────────────────────
// Detection Helpers
// Extracted from MVP — shared across tiers
// ─────────────────────────────────────────────

/**
 * Normalise input text before feeding it to pattern matchers.
 */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Extract a fixed-size window of text surrounding a character index.
 */
export function getSlidingWindow(
  text: string,
  index: number,
  windowSize = 80
): string {
  const start = Math.max(0, index - windowSize)
  const end = Math.min(text.length, index + windowSize)
  return text.slice(start, end)
}

/**
 * Known context trigger words for PII categories.
 */
export const CONTEXT_TRIGGERS: Record<string, string[]> = {
  financial: [
    'account number', 'acct no', 'ifsc', 'bank',
    'credit card', 'debit card', 'card number', 'cvv', 'expiry',
    'ssn', 'social security', 'iban', 'swift', 'bic',
  ],
  identity: [
    'passport', 'driving licence', 'voter id', 'pan card',
    'date of birth', 'dob', 'birth date', 'age',
    'address', 'pincode', 'zip code',
  ],
  credentials: [
    'password', 'secret', 'api key', 'token', 'auth',
    'private key', 'access key', 'secret key',
  ],
}

/**
 * Simple Verhoeff checksum implementation used for ID validation.
 */
export function verhoeffCheck(num: string): boolean {
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ]
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ]

  const digits = num.split('').reverse().map(Number)
  let c = 0
  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i]
    if (digit === undefined) continue
    const pTable = p[i % 8]
    if (!pTable) continue
    const pVal = pTable[digit]
    if (pVal === undefined) continue
    const dRow = d[c]
    if (!dRow) continue
    c = dRow[pVal] ?? 0
  }
  return c === 0
}

/**
 * Luhn algorithm for credit card number validation.
 */
export function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '').split('').map(Number)
  let sum = 0
  let isEven = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i]
    if (d === undefined) continue
    if (isEven) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    isEven = !isEven
  }
  return sum % 10 === 0
}
