// ─────────────────────────────────────────────
// PAN Card Validator (India)
// Format: AAAAA0000A
// ─────────────────────────────────────────────

const VALID_FOURTH_CHAR = new Set(['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G', 'D'])

export function panCheck(pan: string): boolean {
  let cleaned = pan.replace(/\s+/g, '').toUpperCase()

  if (cleaned.length !== 10) return false

  // Fix common OCR misreads in the first 5 letters (digits misread as letters are fixed)
  const firstFive = cleaned.substring(0, 5)
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/5/g, 'S')
    .replace(/2/g, 'Z')
    .replace(/8/g, 'B')

  // Fix common OCR misreads in the 4 digits
  const fourDigits = cleaned.substring(5, 9)
    .replace(/O/g, '0')
    .replace(/I/g, '1')
    .replace(/L/g, '1')
    .replace(/S/g, '5')
    .replace(/Z/g, '2')
    .replace(/B/g, '8')
    .replace(/Q/g, '0')
    .replace(/G/g, '6')

  // Fix common OCR misreads in the last letter
  const lastChar = cleaned.substring(9, 10)
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/5/g, 'S')
    .replace(/2/g, 'Z')
    .replace(/8/g, 'B')

  cleaned = firstFive + fourDigits + lastChar

  // Must match exact format after cleanup
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned)) return false

  // 4th character must be a valid entity type
  const fourthChar = cleaned[3]
  if (!fourthChar || !VALID_FOURTH_CHAR.has(fourthChar)) return false

  return true
}

/**
 * PAN entity type codes:
 * C = Company
 * P = Person
 * H = HUF (Hindu Undivided Family)
 * F = Firm
 * A = AOP (Association of Persons)
 * T = AOP (Trust)
 * B = BOI (Body of Individuals)
 * L = Local Authority
 * J = Artificial Juridical Person
 * G = Government
 */
export function getPANEntityType(pan: string): string | null {
  const entityTypes: Record<string, string> = {
    C: 'Company',
    P: 'Person',
    H: 'HUF',
    F: 'Firm',
    A: 'Association of Persons',
    T: 'Trust',
    B: 'Body of Individuals',
    L: 'Local Authority',
    J: 'Artificial Juridical Person',
    G: 'Government',
  }
  const fourthChar = pan.trim().toUpperCase()[3]
  return fourthChar ? (entityTypes[fourthChar] ?? null) : null
}
