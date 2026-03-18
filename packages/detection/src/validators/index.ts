// ─────────────────────────────────────────────
// Validators — Barrel Export
// ─────────────────────────────────────────────

export { luhnCheck } from './luhn.validator'
export { verhoeffCheck } from './verhoeff.validator'
export { panCheck, getPANEntityType } from './pan.validator'

// Validator registry — maps validatorId to function
export const VALIDATORS: Record<string, (value: string) => boolean> = {
  luhn: (v) => {
    const { luhnCheck: check } = require('./luhn.validator') as { luhnCheck: (v: string) => boolean }
    return check(v)
  },
  verhoeff: (v) => {
    const { verhoeffCheck: check } = require('./verhoeff.validator') as { verhoeffCheck: (v: string) => boolean }
    return check(v)
  },
  pan: (v) => {
    const { panCheck: check } = require('./pan.validator') as { panCheck: (v: string) => boolean }
    return check(v)
  },
}
