// ─────────────────────────────────────────────
// Tiers — Barrel
// Add new tiers here — pipeline auto picks them up
// ─────────────────────────────────────────────

import { RegexTier } from '@securegpt/regex'
import { NERTier } from '@securegpt/ner'
import { OCRTier } from './ocr/ocrTier'
import type { BaseTier } from '@securegpt/shared/tier'

// Registry of all tiers in priority order
// Pipeline runs enabled tiers only
export const TIER_REGISTRY: BaseTier[] = [
  new RegexTier(),
  new NERTier(),
  new OCRTier(),
]

export { RegexTier, NERTier, OCRTier }
export { BaseTier } from '@securegpt/shared/tier'
