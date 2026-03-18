// ─────────────────────────────────────────────
// SecureGPT Detection Pipeline
// Single entry point — extension calls detectPII()
// ─────────────────────────────────────────────

import { RegexTier } from './tiers/regex/regexTier'
import { NERTier } from './tiers/ner/nerTier'
import { OCRTier } from './tiers/ocr/ocrTier'
import { mergeEntities } from './utils/merger.utils'
import { applyAllowlist } from './utils/allowlist.utils'
import type { PIIConfig } from '@securegpt/shared/types'
import type { DetectionResult, PIIEntity, DetectionTier } from '@securegpt/shared/types'

// ─── Tier instances ───────────────────────────
const regexTier = new RegexTier()
const nerTier = new NERTier()
const ocrTier = new OCRTier()

let initialized = false

// ─── Initialize all enabled tiers once ────────
async function initializePipeline(): Promise<void> {
  if (initialized) return

  const initPromises: Promise<void>[] = []

  if (regexTier.enabled) initPromises.push(regexTier.initialize())
  if (nerTier.enabled) initPromises.push(nerTier.initialize())
  if (ocrTier.enabled) initPromises.push(ocrTier.initialize())

  await Promise.all(initPromises)
  initialized = true
}

// ─── Main export ──────────────────────────────
// This is the ONLY function the extension imports
// from this package.
//
// Usage:
//   import { detectPII } from '@securegpt/detection'
//   const result = await detectPII(text, config)

export async function detectPII(
  text: string,
  config: PIIConfig
): Promise<DetectionResult> {
  const startTime = performance.now()

  if (!text || text.trim().length === 0) {
    return buildResult([], 'regex', startTime, text)
  }

  // Initialize tiers on first call
  await initializePipeline()

  // Run Regex and NER in parallel (OCR handled separately via image input)
  const [regexEntities, nerEntities] = await Promise.all([
    regexTier.enabled
      ? regexTier.run(text, config)
      : Promise.resolve<PIIEntity[]>([]),
    nerTier.enabled
      ? nerTier.run(text, config)
      : Promise.resolve<PIIEntity[]>([]),
  ])

  // OCR runs only on image input — text pipeline skips it
  const ocrEntities: PIIEntity[] = []

  // Merge results across tiers — higher tiers win on overlap
  const merged = mergeEntities(regexEntities, nerEntities, ocrEntities)

  // Apply org allowlist
  const filtered = applyAllowlist(merged, config)

  // Determine highest tier used
  const tier = getHighestTier(filtered)

  return buildResult(filtered, tier, startTime, text)
}

// ─── OCR entry point (image input) ────────────
// Called separately when user pastes an image
export async function detectPIIFromImage(
  _imageData: string,
  _config: PIIConfig
): Promise<DetectionResult> {
  const startTime = performance.now()

  // TODO: OCR tier not yet implemented
  // When AI dev implements OCRTier:
  // 1. Pass imageData to ocrTier.run()
  // 2. OCR tier extracts text internally
  // 3. Runs regex + NER on extracted text
  // 4. Returns entities with tier = 'ocr'

  return buildResult([], 'ocr', startTime, '')
}

// ─── Helpers ──────────────────────────────────
function getHighestTier(entities: PIIEntity[]): DetectionTier {
  if (entities.some((e) => e.tier === 'ocr')) return 'ocr'
  if (entities.some((e) => e.tier === 'ner')) return 'ner'
  return 'regex'
}

function buildResult(
  entities: PIIEntity[],
  tier: DetectionTier,
  startTime: number,
  inputText: string
): DetectionResult {
  return {
    hasFindings: entities.length > 0,
    entities,
    tier,
    processingTimeMs: Math.round(performance.now() - startTime),
    inputLength: inputText.length,
  }
}

// ─── Re-export types for convenience ──────────
export type { DetectionResult, PIIEntity, PIIConfig }
