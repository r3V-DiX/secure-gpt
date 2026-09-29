// ─────────────────────────────────────────────
// SecureGPT Detection Pipeline
// Single entry point — extension calls detectPII()
// ─────────────────────────────────────────────

import { RegexTier } from '@securegpt/regex'
import { NERTier } from '@securegpt/ner'
import { OCRTier } from './tiers/ocr/ocrTier'
import { mergeEntities } from './utils/merger.utils'
import { applyAllowlist } from './utils/allowlist.utils'
import type { PIIConfig } from '@securegpt/shared/types'
import type { DetectionResult, PIIEntity, DetectionTier } from '@securegpt/shared/types'

// ─── Tier instances ───────────────────────────
const regexTier = new RegexTier()
const nerTier = new NERTier()
const ocrTier = new OCRTier()

// Bug 17 fix: replace the plain boolean with a shared promise so concurrent
// callers all await the same initialization rather than each spawning their own.
let initPromise: Promise<void> | null = null

async function initializePipeline(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const tasks: Promise<void>[] = []
    if (regexTier.enabled) tasks.push(regexTier.initialize())
    if (nerTier.enabled) tasks.push(nerTier.initialize())
    if (ocrTier.enabled) tasks.push(ocrTier.initialize())
    await Promise.all(tasks)
  })()

  return initPromise
}

// ─── Main export ──────────────────────────────
export async function detectPII(
  text: string,
  config: PIIConfig
): Promise<DetectionResult> {
  const startTime = performance.now()

  if (!text || text.trim().length === 0) {
    return buildResult([], 'regex', startTime, text)
  }

  await initializePipeline()

  const regexEntities = regexTier.enabled
    ? await regexTier.run(text, config)
    : []

  let maskedText = text
  if (nerTier.enabled && regexEntities.length > 0) {
    for (const entity of regexEntities) {
      const length = entity.endIndex - entity.startIndex
      const spaces = ' '.repeat(length)
      maskedText = maskedText.substring(0, entity.startIndex) + spaces + maskedText.substring(entity.endIndex)
    }
  }

  const nerEntities = nerTier.enabled
    ? await nerTier.run(maskedText, config)
    : []

  const ocrEntities: PIIEntity[] = []

  const merged = mergeEntities(regexEntities, nerEntities, ocrEntities)
  const filtered = applyAllowlist(merged, config)
  const tier = getHighestTier(filtered)

  return buildResult(filtered, tier, startTime, text)
}

// ─── OCR entry point (image input) ────────────
export async function detectPIIFromImage(
  imageData: string,
  config: PIIConfig
): Promise<DetectionResult> {
  const startTime = performance.now()

  if (!ocrTier.enabled) {
    return buildResult([], 'ocr', startTime, '')
  }

  await initializePipeline()

  const { rawText, ocrData, severityFloor, scale, rotation, imgWidth, imgHeight } = await ocrTier.runOnImage(imageData, config)

  if (!rawText) {
    return buildResult([], 'ocr', startTime, '')
  }

  const regexEntities = regexTier.enabled
    ? await regexTier.run(rawText, config)
    : await Promise.resolve<PIIEntity[]>([])

  let maskedRawText = rawText
  if (nerTier.enabled && regexEntities.length > 0) {
    for (const entity of regexEntities) {
      const length = entity.endIndex - entity.startIndex
      const spaces = ' '.repeat(length)
      maskedRawText = maskedRawText.substring(0, entity.startIndex) + spaces + maskedRawText.substring(entity.endIndex)
    }
  }

  const nerEntities = nerTier.enabled
    ? await nerTier.run(maskedRawText, config)
    : await Promise.resolve<PIIEntity[]>([])

  const merged = mergeEntities(regexEntities, nerEntities, [])
  const ocrEntities = ocrTier.mapEntitiesToBboxes(merged, ocrData, rawText, severityFloor, scale, rotation, imgWidth, imgHeight)

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

// ─── Re-export types ──────────────────────────
export type { DetectionResult, PIIEntity, PIIConfig }

// ─── Re-export tier classes for offscreen document use ────────────────────────
export { OCRTier } from './tiers/ocr/ocrTier'
export { RegexTier } from '@securegpt/regex'
export { NERTier } from '@securegpt/ner'  // Bug 8 fix: needed by offscreen OCR path
