// ─────────────────────────────────────────────
// Tier 1 — Regex Detection
// Fastest tier. Runs pattern matching + validators
// ─────────────────────────────────────────────

import { BaseTier } from '../base-tier'
import { getActiveRules } from '../../rules'
import { buildCustomRules } from '../../rules/custom'
import { luhnCheck } from '../../validators/luhn.validator'
import { verhoeffCheck } from '../../validators/verhoeff.validator'
import { panCheck } from '../../validators/pan.validator'
import { DETECTION_TYPE_TO_TOKEN, MASKING_TOKENS } from '@securegpt/shared/constants'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import { v4 as uuidv4 } from 'uuid'

const VALIDATORS: Record<string, (value: string) => boolean> = {
  luhn: luhnCheck,
  verhoeff: verhoeffCheck,
  pan: panCheck,
}

export class RegexTier extends BaseTier {
  readonly name = 'regex' as const
  readonly enabled = true

  async run(text: string, config: PIIConfig): Promise<PIIEntity[]> {
    if (!text || text.trim().length === 0) return []

    const staticRules = getActiveRules(config)
    const customRules = buildCustomRules(config)
    const allRules = [...staticRules, ...customRules]

    const entities: PIIEntity[] = []

    for (const rule of allRules) {
      // Reset regex lastIndex for global flag
      rule.pattern.lastIndex = 0

      let match: RegExpExecArray | null

      while ((match = rule.pattern.exec(text)) !== null) {
        const value = match[0]

        // Skip empty matches
        if (!value || value.trim().length === 0) continue

        // Check allowlist
        const categoryConfig = config.categories[rule.category]
        if (categoryConfig?.allowlist?.some((a) => value.toLowerCase().includes(a.toLowerCase()))) {
          continue
        }

        // Run validator if rule requires it
        if (rule.validatorId) {
          const validator = VALIDATORS[rule.validatorId]
          if (validator && !validator(value)) continue
        }

        const maskedValue =
          DETECTION_TYPE_TO_TOKEN[rule.type] ?? MASKING_TOKENS.GENERIC

        entities.push({
          id: uuidv4(),
          type: rule.type,
          category: rule.category,
          value,
          maskedValue,
          startIndex: match.index,
          endIndex: match.index + value.length,
          confidence: rule.validatorId ? 0.99 : 0.85,
          severity: rule.severity,
          tier: 'regex',
        })
      }

      // Reset again after use
      rule.pattern.lastIndex = 0
    }

    return this.deduplicate(entities)
  }

  // Remove overlapping or duplicate matches — keep highest confidence
  private deduplicate(entities: PIIEntity[]): PIIEntity[] {
    if (entities.length === 0) return []

    // Sort by startIndex
    const sorted = [...entities].sort((a, b) => a.startIndex - b.startIndex)
    const result: PIIEntity[] = []

    for (const entity of sorted) {
      const last = result[result.length - 1]
      if (last && entity.startIndex < last.endIndex) {
        // Overlapping — keep the one with higher confidence
        if (entity.confidence > last.confidence) {
          result[result.length - 1] = entity
        }
      } else {
        result.push(entity)
      }
    }

    return result
  }
}
