// ─────────────────────────────────────────────
// Confidential Signals & Fuzzy Classifier
// ─────────────────────────────────────────────

import type { Severity } from '@securegpt/shared/types'

export const CONFIDENTIAL_SIGNALS = [
  'confidential',
  'internal only',
  'restricted',
  'not for distribution',
  'proprietary',
  'top secret',
  'classified',
  'privileged',
  'do not share',
  'private',
  'sensitive',
  'draft',
  'passport',
  'aadhaar',
  'uidai',
  'pan card',
  'income tax',
  'republic of india',
  'government of india',
]

/**
 * Computes Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length
  const bn = b.length
  if (an === 0) return bn
  if (bn === 0) return an

  const matrix: number[][] = []
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= an; j++) {
    matrix[0]![j] = j
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1,     // insertion
          matrix[i - 1]![j]! + 1      // deletion
        )
      }
    }
  }

  return matrix[bn]![an]!
}

/**
 * Checks whether text contains confidential signals (exact substring or fuzzy match).
 */
export function classifyDocumentFuzzy(text: string): {
  isConfidential: boolean
  matchedSignals: string[]
  severityFloor: Severity
} {
  const lower = text.toLowerCase()
  const matchedSignals: string[] = []

  // 1. Exact substring check
  for (const signal of CONFIDENTIAL_SIGNALS) {
    if (lower.includes(signal)) {
      matchedSignals.push(signal)
    }
  }

  // 2. Fuzzy word-level check for short high-signal words (e.g. 'c0nfidential' -> distance <= 2)
  if (matchedSignals.length === 0) {
    const words = lower.split(/[^a-z0-9]+/).filter((w) => w.length >= 5)
    for (const signal of CONFIDENTIAL_SIGNALS) {
      if (!signal.includes(' ')) {
        for (const w of words) {
          if (Math.abs(w.length - signal.length) <= 2) {
            const dist = levenshteinDistance(w, signal)
            if (dist <= 2) {
              matchedSignals.push(signal)
              break
            }
          }
        }
      }
    }
  }

  const isConfidential = matchedSignals.length > 0
  return {
    isConfidential,
    matchedSignals,
    severityFloor: isConfidential ? 'high' : 'medium',
  }
}
