// ─────────────────────────────────────────────
// Masking Service
// Replaces detected PII with placeholder tokens
// ─────────────────────────────────────────────

import type { PIIEntity } from '@securegpt/shared/types'

export function applyMasking(text: string, entities: PIIEntity[]): string {
  if (!entities.length) return text

  // Sort by startIndex descending so we replace from end to start
  // This prevents index shifting when replacing
  const sorted = [...entities].sort((a, b) => b.startIndex - a.startIndex)

  let result = text
  for (const entity of sorted) {
    result =
      result.slice(0, entity.startIndex) +
      entity.maskedValue +
      result.slice(entity.endIndex)
  }

  return result
}

export function previewMasking(
  text: string,
  entities: PIIEntity[]
): { original: string; masked: string; diff: Array<{ text: string; masked: boolean }> } {
  const masked = applyMasking(text, entities)

  // Build diff for UI rendering
  const sorted = [...entities].sort((a, b) => a.startIndex - b.startIndex)
  const diff: Array<{ text: string; masked: boolean }> = []
  let cursor = 0

  for (const entity of sorted) {
    if (cursor < entity.startIndex) {
      diff.push({ text: text.slice(cursor, entity.startIndex), masked: false })
    }
    diff.push({ text: entity.maskedValue, masked: true })
    cursor = entity.endIndex
  }

  if (cursor < text.length) {
    diff.push({ text: text.slice(cursor), masked: false })
  }

  return { original: text, masked, diff }
}
