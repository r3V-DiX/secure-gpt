// ─────────────────────────────────────────────
// Tiers — Barrel
// Add new tiers here — pipeline auto picks them up
// ─────────────────────────────────────────────

import { RegexTier } from './regex/regexTier'
import { NERTier } from './ner/nerTier'
import { OCRTier } from './ocr/ocrTier'
import type { BaseTier } from './base-tier'

// Registry of all tiers in priority order
// Pipeline runs enabled tiers only
export const TIER_REGISTRY: BaseTier[] = [
  new RegexTier(),
  new NERTier(),
  new OCRTier(),
]

export { RegexTier, NERTier, OCRTier }
export { BaseTier } from './base-tier'
