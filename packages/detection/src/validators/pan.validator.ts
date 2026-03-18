// ─────────────────────────────────────────────
// PAN Card Validator (India)
// Format: AAAAA0000A
// ─────────────────────────────────────────────

const VALID_FOURTH_CHAR = new Set(['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'])

export function panCheck(pan: string): boolean {
  const cleaned = pan.trim().toUpperCase()

  // Must match format exactly: 5 letters, 4 digits, 1 letter
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
