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
    // Try international format first
    if (isValidPhoneNumber(value)) return true
    
    // Fallback to local US format
    if (isValidPhoneNumber(value, 'US')) return true
    
    // Fallback to local Indian format
    if (isValidPhoneNumber(value, 'IN')) return true
    
    return false
  } catch {
    return false
  }
}
