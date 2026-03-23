// ─────────────────────────────────────────────
// OCR Utils
// Document classification and severity management
// ─────────────────────────────────────────────

import type { Severity } from '@securegpt/shared/types'

export const CONFIDENTIAL_SIGNALS = [
  'confidential', 'internal only', 'restricted', 'not for distribution',
  'proprietary', 'top secret', 'classified', 'privileged', 'do not share',
  'private', 'sensitive', 'draft', 'passport', 'aadhaar', 'uidai',
  'pan card', 'income tax', 'republic of india', 'government of india',
]

export function classifyDocument(text: string): {
  isConfidential: boolean
  severityFloor: Severity
} {
  const lower = text.toLowerCase()
  const isConfidential = CONFIDENTIAL_SIGNALS.some((s) => lower.includes(s))
  return {
    isConfidential,
    severityFloor: isConfidential ? 'high' : 'medium',
  }
}

export function upgradeSeverity(current: Severity, floor: Severity): Severity {
  const rank: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 }
  return rank[current] >= rank[floor] ? current : floor
}
