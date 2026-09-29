// ─────────────────────────────────────────────
// Validators — Barrel Export
// ─────────────────────────────────────────────

import { luhnCheck } from './luhn.validator'
import { verhoeffCheck } from './verhoeff.validator'
import { panCheck, getPANEntityType } from './pan.validator'
import { phoneCheck } from './phone.validator'
import { ibanCheck } from './iban.validator'
import { jwtParserCheck } from './jwt.validator'
import { entropyCheck } from './entropy.validator'

export { luhnCheck, verhoeffCheck, panCheck, getPANEntityType, phoneCheck, ibanCheck, jwtParserCheck, entropyCheck }

export const VALIDATORS: Record<string, (value: string) => boolean> = {
  luhn: luhnCheck,
  verhoeff: verhoeffCheck,
  pan: panCheck,
  phone: phoneCheck,
  mod97: ibanCheck,
  jwt_parser: jwtParserCheck,
  entropy: entropyCheck,
}
