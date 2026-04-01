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

  // Run Regex first
  const regexEntities = regexTier.enabled
    ? await regexTier.run(text, config)
    : [];

  // Mask the text before passing to NER (Regex results hidden with spaces)
  let maskedText = text;
  if (nerTier.enabled && regexEntities.length > 0) {
    for (const entity of regexEntities) {
      const length = entity.endIndex - entity.startIndex;
      const spaces = " ".repeat(length);
      maskedText = maskedText.substring(0, entity.startIndex) + spaces + maskedText.substring(entity.endIndex);
    }
  }

  // Run NER on masked text
  const nerEntities = nerTier.enabled
    ? await nerTier.run(maskedText, config)
    : [];

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
  imageData: string,
  config: PIIConfig
): Promise<DetectionResult> {
  const startTime = performance.now()

  if (!ocrTier.enabled) {
    return buildResult([], 'ocr', startTime, '')
  }

  // Initialize tiers
  await initializePipeline()

  // 1. Extract text via OCR
  const { rawText, ocrData, severityFloor } = await ocrTier.runOnImage(imageData, config)
  
  if (!rawText) {
    return buildResult([], 'ocr', startTime, '')
  }

  // 2. Run Regex and NER sequentially on extracted text with masking
  const regexEntities = regexTier.enabled
    ? await regexTier.run(rawText, config)
    : await Promise.resolve<PIIEntity[]>([]);

  let maskedRawText = rawText;
  if (nerTier.enabled && regexEntities.length > 0) {
    for (const entity of regexEntities) {
      const length = entity.endIndex - entity.startIndex;
      const spaces = " ".repeat(length);
      maskedRawText = maskedRawText.substring(0, entity.startIndex) + spaces + maskedRawText.substring(entity.endIndex);
    }
  }

  const nerEntities = nerTier.enabled
    ? await nerTier.run(maskedRawText, config)
    : await Promise.resolve<PIIEntity[]>([]);

  // 3. Merge results and map to BBOXes
  const merged = mergeEntities(regexEntities, nerEntities, [])
  const ocrEntities = ocrTier.mapEntitiesToBboxes(merged, ocrData, rawText, severityFloor)

  // Apply allowlist
  const filtered = applyAllowlist(ocrEntities, config)

  return buildResult(filtered, 'ocr', startTime, rawText)
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
