// ─────────────────────────────────────────────
// All Rules — Master Barrel
// ─────────────────────────────────────────────

import { allFinancialRules } from './financial'
import { allPIIRules } from './pii'
import { allConfidentialRules } from './confidential'
import { allIPRules } from './ip'
import type { DetectionRule } from './schema'
import type { PIIConfig } from '@securegpt/shared/types'

export { DetectionRule }

// All static rules combined
export const ALL_RULES: DetectionRule[] = [
  ...allFinancialRules,
  ...allPIIRules,
  ...allConfidentialRules,
  ...allIPRules,
]

// Cache for compiled rules
let ruleCache: { version: string; rules: DetectionRule[] } | null = null

// Filter rules based on org policy config
export function getActiveRules(config: PIIConfig): DetectionRule[] {
  const cacheKey = config.updatedAt || String(config.version)

  if (ruleCache && ruleCache.version === cacheKey) {
    return ruleCache.rules
  }

  // 1. Get static built-in rules, respecting per-rule overrides
  const activeStaticRules = ALL_RULES.filter((rule) => {
    const categoryName = Object.keys(config.categories).find(
      (k) => k.toUpperCase() === rule.category.toUpperCase()
    )
    const categoryConfig = categoryName ? config.categories[categoryName] : undefined
    if (!categoryConfig?.enabled) return false

    // Per-rule enabled override takes precedence over rule.enabled
    const override = categoryConfig.ruleOverrides?.[rule.id]
    return override?.enabled !== undefined ? override.enabled : rule.enabled
  })

  // 2. Extract and compile custom rules
  const customRules: DetectionRule[] = []
  for (const [categoryName, categoryConfig] of Object.entries(config.categories)) {
    if (categoryConfig.enabled && categoryConfig.customRules) {
      const rules: DetectionRule[] = categoryConfig.customRules.map((cr) => {
        const rule: DetectionRule = {
          id: cr.id,
          category: categoryName,
          type: 'custom',
          label: cr.label,
          pattern: new RegExp(cr.pattern, cr.caseSensitive ? 'g' : 'gi'),
          severity: cr.severity,
          enabled: true,
          description: cr.description || '',
          requireContext: cr.requireContext || false,
          triggers: cr.triggers || [],
        }
        if (cr.maskingLabel) {
          rule.maskingLabel = cr.maskingLabel
        }
        return rule
      })
      customRules.push(...rules)
    }
  }

  const allActiveRules = [...activeStaticRules, ...customRules]

  ruleCache = { version: cacheKey, rules: allActiveRules }

  return allActiveRules
}
