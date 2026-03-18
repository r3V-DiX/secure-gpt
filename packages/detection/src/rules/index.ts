// ─────────────────────────────────────────────
// All Rules — Master Barrel
// ─────────────────────────────────────────────

import { allFinancialRules } from './financial'
import { allPIIRules } from './pii'
import { allConfidentialRules } from './confidential'
import { allIPRules } from './ip'
import type { DetectionRule } from './schema'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'

export { DetectionRule }

// All static rules combined
export const ALL_RULES: DetectionRule[] = [
  ...allFinancialRules,
  ...allPIIRules,
  ...allConfidentialRules,
  ...allIPRules,
]

// Filter rules based on org policy config
export function getActiveRules(config: PIIConfig): DetectionRule[] {
  return ALL_RULES.filter((rule) => {
    const categoryConfig = config.categories[rule.category as PIICategory]
    return categoryConfig?.enabled && rule.enabled
  })
}
