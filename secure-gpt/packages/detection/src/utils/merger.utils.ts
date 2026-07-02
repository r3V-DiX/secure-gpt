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

  // Sort primarily by start index
  const sorted = [...all].sort((a, b) => a.startIndex - b.startIndex)

  const result: PIIEntity[] = []

  for (const entity of sorted) {
    const last = result[result.length - 1]

    if (last && entity.startIndex < last.endIndex) {
      // Overlapping — keep the one with higher tier priority
      const lastPriority = TIER_PRIORITY[last.tier]
      const currentPriority = TIER_PRIORITY[entity.tier]

      if (currentPriority > lastPriority) {
        // Current entity is from a more trusted tier, replace last
        result[result.length - 1] = entity
      } else if (currentPriority === lastPriority) {
        // Same tier, keep the one with higher confidence
        if (entity.confidence > last.confidence) {
          result[result.length - 1] = entity
        }
      }
      // If currentPriority < lastPriority, we simply ignore the current overlapping entity
    } else {
      result.push(entity)
    }
  }

  return result
}
