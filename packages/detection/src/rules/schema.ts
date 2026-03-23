// ─────────────────────────────────────────────
// Detection Rule Schema
// Every rule in rules/ must implement this interface
// ─────────────────────────────────────────────

import type { PIICategory } from '@securegpt/shared/constants'
import type { Severity } from '@securegpt/shared/types'

export interface DetectionRule {
  id: string                    // unique rule id e.g. 'financial.credit_card'
  category: PIICategory
  type: string                  // e.g. 'credit_card', 'email', 'pan_card'
  label: string                 // human readable label
  pattern: RegExp               // regex pattern
  validatorId?: string          // optional: 'luhn' | 'verhoeff' | 'pan'
  requireContext?: boolean      // if true, only flag when a context trigger is nearby
  severity: Severity
  enabled: boolean
  description: string
}
