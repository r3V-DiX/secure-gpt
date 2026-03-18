// ─────────────────────────────────────────────
// Custom Rules Loader
// Reads org-defined keywords from PIIConfig
// and converts them into DetectionRules at runtime
// ─────────────────────────────────────────────

import type { PIIConfig, CategoryConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'
import type { DetectionRule } from '../schema'

export function buildCustomRules(config: PIIConfig): DetectionRule[] {
  const customRules: DetectionRule[] = []

  const categories = Object.entries(config.categories) as Array<
    [PIICategory, CategoryConfig]
  >

  for (const [category, categoryConfig] of categories) {
    if (!categoryConfig.enabled || !categoryConfig.customKeywords?.length) {
      continue
    }

    const keywords = categoryConfig.customKeywords
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0)

    if (keywords.length === 0) continue

    // Escape special regex characters in keywords
    const escapedKeywords = keywords.map((kw) =>
      kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )

    const pattern = new RegExp(
      `\\b(?:${escapedKeywords.join('|')})\\b`,
      'gi'
    )

    customRules.push({
      id: `custom.${category.toLowerCase()}.keywords`,
      category,
      type: 'credentials',
      label: `Custom Keywords (${category})`,
      pattern,
      severity: 'high',
      enabled: true,
      description: `Org-defined custom keywords for ${category}`,
    })
  }

  return customRules
}
