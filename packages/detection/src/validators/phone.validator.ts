// ─────────────────────────────────────────────
// Phone Number Validator
// Uses libphonenumber-js for global validation
// ─────────────────────────────────────────────

import { isValidPhoneNumber } from 'libphonenumber-js'

/**
 * Validates a potential phone number string using the Google libphonenumber port.
 * It checks if the number is valid for any supported country.
 */
export function phoneCheck(value: string): boolean {
  if (!value || value.length < 7) return false
  
  try {
    // We don't provide a default country because we want a "Broad Net"
    // that catches international formats (+...) as well as local formats
    // if they match a known pattern.
    return isValidPhoneNumber(value)
  } catch {
    return false
  }
}
