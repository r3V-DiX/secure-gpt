// ─────────────────────────────────────────────
// Tier 1 — Regex Detection
// Fastest tier. Runs pattern matching + validators
// ─────────────────────────────────────────────

import { BaseTier } from '@securegpt/shared/tier'
import { getActiveRules } from './rules'
import { luhnCheck } from './validators/luhn.validator'
import { verhoeffCheck } from './validators/verhoeff.validator'
import { panCheck } from './validators/pan.validator'
import { phoneCheck } from './validators/phone.validator'
import { ibanCheck } from './validators/iban.validator'
import { jwtParserCheck } from './validators/jwt.validator'
import { entropyCheck } from './validators/entropy.validator'
import { DETECTION_TYPE_TO_TOKEN, MASKING_TOKENS } from '@securegpt/shared/constants'
import { getSlidingWindow } from '@securegpt/shared/utils/detection-helpers'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import { v4 as uuidv4 } from 'uuid'
import { CONTEXT_TRIGGERS } from '@securegpt/shared/utils/detection-helpers'

const VALIDATORS: Record<string, (value: string) => boolean> = {
  luhn: luhnCheck,
  verhoeff: verhoeffCheck,
  pan: panCheck,
  phone: phoneCheck,     // Bug 6 fix: was missing — phone matches passed unvalidated
  mod97: ibanCheck,      // Bug 7 fix: IBAN checksum validation
  jwt_parser: jwtParserCheck, // Bug 7 fix: JWT structural validation
  entropy: entropyCheck, // Bug 7 fix: high-entropy string check for API keys
}

// const ALL_TRIGGERS = Object.values(CONTEXT_TRIGGERS).flat()

export class RegexTier extends BaseTier {
  readonly name = 'regex' as const
  readonly enabled = true

  async run(text: string, config: PIIConfig, preserveOverlaps = false): Promise<PIIEntity[]> {
    if (!text || text.trim().length === 0) return []

    const allRules = getActiveRules(config)

    const entities: PIIEntity[] = []

    for (const rule of allRules) {
      // Reset regex lastIndex for global flag
      rule.pattern.lastIndex = 0

      let match: RegExpExecArray | null

      while ((match = rule.pattern.exec(text)) !== null) {
        // Prevent infinite loops on zero-length matches
        if (match.index === rule.pattern.lastIndex) {
          rule.pattern.lastIndex++
        }

        // Handle patterns that might use capture groups (extracted from MVP)
        const values = rule.captureGroups
          ? rule.captureGroups.map((group) => match![group]).filter((value): value is string => Boolean(value))
          : [match[1] ?? match[0]]

        // Context-gated patterns
        if (rule.requireContext) {
          const context = getSlidingWindow(text, match.index, 250).toLowerCase()
          
          // Use specific triggers if defined, otherwise fall back to category triggers
          const triggers = rule.triggers ?? 
            CONTEXT_TRIGGERS[rule.category.toLowerCase()] ?? 
            []
            
          if (!triggers.some(t => context.includes(t.toLowerCase()))) {
            continue
          }
        }

        const maskedValue = rule.maskingLabel
          ? `[${rule.maskingLabel}-REDACTED]`
          : (DETECTION_TYPE_TO_TOKEN[rule.type] ?? MASKING_TOKENS.GENERIC)
        let searchFrom = 0
        for (const value of values) {
          if (!value.trim()) continue
          const categoryConfig = config.categories[rule.category]
          if (categoryConfig?.allowlist?.some((a) => value.toLowerCase().includes(a.toLowerCase()))) continue
          if (rule.validatorId) {
            const validator = VALIDATORS[rule.validatorId]
            if (validator && !validator(value)) {
              rule.pattern.lastIndex = match.index + 1
              continue
            }
          }
          const withinMatch = match[0].indexOf(value, searchFrom)
          if (withinMatch < 0) continue
          searchFrom = withinMatch + value.length
          const start = match.index + withinMatch
          entities.push({
            id: uuidv4(),
            ruleId: rule.id,
            type: rule.type,
            label: rule.label,
            category: rule.category,
            value,
            maskedValue,
            startIndex: start,
            endIndex: start + value.length,
            confidence: rule.validatorId ? 0.99 : 0.85,
            severity: rule.severity,
            tier: 'regex',
          })
        }
      }

      // Reset again after use
      rule.pattern.lastIndex = 0
    }

    return preserveOverlaps ? entities : this.deduplicate(entities)
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
