// ─────────────────────────────────────────────
// Merger Utils
// Merges overlapping detections across tiers
// ─────────────────────────────────────────────

import type { PIIEntity } from '@securegpt/shared/types'

// Tier priority — higher index = more trusted
const TIER_PRIORITY = { regex: 0, ner: 1, ocr: 2 }

export function mergeEntities(
  regexEntities: PIIEntity[],
  nerEntities: PIIEntity[],
  ocrEntities: PIIEntity[]
): PIIEntity[] {
  const all = [...regexEntities, ...nerEntities, ...ocrEntities]
  if (all.length === 0) return []

  // Sort by start index, then by tier priority descending
  const sorted = [...all].sort((a, b) => {
    if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex
    return TIER_PRIORITY[b.tier] - TIER_PRIORITY[a.tier]
  })

  const result: PIIEntity[] = []

  for (const entity of sorted) {
    const last = result[result.length - 1]

    if (last && entity.startIndex < last.endIndex) {
      // Overlapping — keep higher tier or higher confidence
      const lastPriority = TIER_PRIORITY[last.tier]
      const currentPriority = TIER_PRIORITY[entity.tier]

      if (
        currentPriority > lastPriority ||
        (currentPriority === lastPriority && entity.confidence > last.confidence)
      ) {
        result[result.length - 1] = entity
      }
    } else {
      result.push(entity)
    }
  }

  return result
}
