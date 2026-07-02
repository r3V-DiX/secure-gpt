// ─────────────────────────────────────────────
// Scorer Utils
// Confidence scoring helpers
// ─────────────────────────────────────────────

import type { PIIEntity } from '@securegpt/shared/types'
import type { Severity } from '@securegpt/shared/types'

export function getOverallSeverity(entities: PIIEntity[]): Severity {
  if (entities.length === 0) return 'low'

  const severityOrder: Severity[] = ['low', 'medium', 'high', 'critical']

  return entities.reduce<Severity>((highest, entity) => {
    const currentIdx = severityOrder.indexOf(entity.severity)
    const highestIdx = severityOrder.indexOf(highest)
    return currentIdx > highestIdx ? entity.severity : highest
  }, 'low')
}

export function getAverageConfidence(entities: PIIEntity[]): number {
  if (entities.length === 0) return 0
  const total = entities.reduce((sum, e) => sum + e.confidence, 0)
  return total / entities.length
}
