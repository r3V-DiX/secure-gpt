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
    await Promise.all(tasks)
  })()

  try { await initPromise } catch (error) { initPromise = null; throw error }
}

export async function warmDocumentDetection(): Promise<void> {
  await Promise.all([initializePipeline(), nerTier.initialize(), ocrTier.initialize()])
}

// ─── Main export ──────────────────────────────
export async function detectPII(
  text: string,
  config: PIIConfig,
  options?: { strict?: boolean; signal?: AbortSignal; onFindings?: (entities: PIIEntity[]) => void }
): Promise<DetectionResult> {
  const startTime = performance.now()

  if (!text || text.trim().length === 0) {
    return buildResult([], 'regex', startTime, text)
  }

  options?.signal?.throwIfAborted()
  await initializePipeline()

  const regexEntities = regexTier.enabled
    ? await regexTier.run(text, config, options?.strict)
    : []
  options?.onFindings?.(applyAllowlist(regexEntities, config))

  let maskedText = text
  if (!options?.strict && nerTier.enabled && regexEntities.length > 0) {
    for (const entity of regexEntities) {
      const length = entity.endIndex - entity.startIndex
      const spaces = ' '.repeat(length)
      maskedText = maskedText.substring(0, entity.startIndex) + spaces + maskedText.substring(entity.endIndex)
    }
  }

  const nerEntities = nerTier.enabled
    ? await nerTier.run(maskedText, config, options?.strict, options?.signal)
    : []
  options?.onFindings?.(applyAllowlist(nerEntities, config))

  const ocrEntities: PIIEntity[] = []

  options?.signal?.throwIfAborted()
  const merged = options?.strict ? [...regexEntities, ...nerEntities] : mergeEntities(regexEntities, nerEntities, ocrEntities)
  const filtered = applyAllowlist(merged, config)
  const tier = getHighestTier(filtered)

  return buildResult(filtered, tier, startTime, text)
}

// ─── OCR entry point (image input) ────────────
export async function detectPIIFromImage(
  imageData: string,
  config: PIIConfig,
  options?: { strict?: boolean; signal?: AbortSignal; onFindings?: (entities: PIIEntity[]) => void }
): Promise<DetectionResult> {
  const startTime = performance.now()

  if (!ocrTier.enabled) {
    return buildResult([], 'ocr', startTime, '')
  }

  options?.signal?.throwIfAborted()
  await initializePipeline()

  const { rawText, ocrData, severityFloor, scale, rotation, imgWidth, imgHeight, confidence } = await ocrTier.runOnImage(imageData, config, options?.signal)
  if (options?.strict && confidence < 50) throw new Error('DOCUMENT_UNREADABLE_IMAGE')

  if (!rawText) {
    if (options?.strict) throw new Error('DOCUMENT_UNREADABLE_IMAGE')
    return buildResult([], 'ocr', startTime, '')
  }

  const regexEntities = regexTier.enabled
    ? await regexTier.run(rawText, config, options?.strict)
    : await Promise.resolve<PIIEntity[]>([])
  options?.onFindings?.(applyAllowlist(regexEntities, config))

  let maskedRawText = rawText
  if (!options?.strict && nerTier.enabled && regexEntities.length > 0) {
    for (const entity of regexEntities) {
      const length = entity.endIndex - entity.startIndex
      const spaces = ' '.repeat(length)
      maskedRawText = maskedRawText.substring(0, entity.startIndex) + spaces + maskedRawText.substring(entity.endIndex)
    }
  }

  const nerEntities = nerTier.enabled
    ? await nerTier.run(maskedRawText, config, options?.strict, options?.signal)
    : await Promise.resolve<PIIEntity[]>([])
  options?.onFindings?.(applyAllowlist(nerEntities, config))

  options?.signal?.throwIfAborted()
  const merged = options?.strict ? [...regexEntities, ...nerEntities] : mergeEntities(regexEntities, nerEntities, [])
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
