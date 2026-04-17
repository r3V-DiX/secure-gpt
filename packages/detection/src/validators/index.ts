// ─────────────────────────────────────────────
// Validators — Barrel Export
// ─────────────────────────────────────────────

import { luhnCheck } from './luhn.validator'
import { verhoeffCheck } from './verhoeff.validator'
import { panCheck, getPANEntityType } from './pan.validator'
import { phoneCheck } from './phone.validator'

export { luhnCheck, verhoeffCheck, panCheck, getPANEntityType, phoneCheck }

// Validator registry — maps validatorId to function
export const VALIDATORS: Record<string, (value: string) => boolean> = {
  luhn: luhnCheck,
  verhoeff: verhoeffCheck,
  pan: panCheck,
  phone: phoneCheck,
}
