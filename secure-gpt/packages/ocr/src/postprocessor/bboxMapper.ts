// ─────────────────────────────────────────────
// High-Precision OCR Bounding Box Mapper
// Maps extracted character entities to physical pixel coordinates
// ─────────────────────────────────────────────

import type { PIIEntity, Severity } from '@securegpt/shared/types'
import { normalizeText } from '@securegpt/shared/utils/detection-helpers'
import type { OcrEngineResult, OcrWord } from '../types'
import { repairOcrText } from './glyphRepair'

export function upgradeSeverity(current: Severity, floor: Severity): Severity {
  const rank: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 }
  return rank[current] >= rank[floor] ? current : floor
}

export function mapEntitiesToBboxes(
  entities: PIIEntity[],
  ocrData: OcrEngineResult | any,
  rawText: string,
  severityFloor: Severity = 'medium',
  scale: number = 1,
  rotation: number = 0,
  imgWidth: number = 0,
  imgHeight: number = 0
): PIIEntity[] {
  if (!ocrData) return entities

  const words: OcrWord[] =
    ocrData.words ||
    ocrData.blocks?.flatMap((b: any) =>
      b.paragraphs?.flatMap((p: any) =>
        p.lines?.flatMap((l: any) => l.words || []) || []
      ) || []
    ) || []

  if (words.length === 0) {
    return entities
  }

  // Build character index to bbox mapping
  const charBboxes: any[] = []
  let cursor = 0

  for (const word of words) {
    const wordText = normalizeText(word.text)
    if (!wordText) continue

    const startIndex = rawText.indexOf(wordText, cursor)
    if (startIndex !== -1) {
      for (let i = 0; i < wordText.length; i++) {
        charBboxes[startIndex + i] = word.bbox
      }
      cursor = startIndex + wordText.length
    }
  }

  return entities.map((entity) => {
    const bboxes: any[] = []
    const seen = new Set<string>()

    // Every non-space character must have provenance. A box for only part of a
    // value is not sufficient redaction coverage.
    const complete = entity.endIndex > entity.startIndex && entity.endIndex <= rawText.length &&
      Array.from({ length: entity.endIndex - entity.startIndex }, (_, offset) => entity.startIndex + offset)
        .every(index => /\s/.test(rawText[index]!) || !!charBboxes[index])
    for (let i = entity.startIndex; complete && i < entity.endIndex; i++) {
      const box = charBboxes[i]
      if (box) {
        const key = `${box.x0},${box.y0},${box.x1},${box.y1}`
        if (!seen.has(key)) {
          seen.add(key)
          bboxes.push(box)
        }
      }
    }

    // Repaired values are appended to the OCR text. Recover their provenance
    // from contiguous original words rather than matching arbitrary fragments.
    if (bboxes.length === 0 && entity.value) {
      const compact = (text: string) => normalizeText(text).replace(/[\s-]+/g, '').toLowerCase()
      const needle = compact(entity.value)
      const candidates: { start: number; end: number }[] = []
      for (let start = 0; start < words.length; start++) {
        for (let end = start + 1; end <= Math.min(words.length, start + 12); end++) {
          const span = words.slice(start, end)
          const source = span.map(word => word.text).join(' ')
          const recovered = repairOcrText(source).split('\n')
          if (!recovered.some(candidate => compact(candidate) === needle)) continue
          candidates.push({ start, end })
          break
        }
      }
      // Keep the smallest source span for each occurrence of a recovered value.
      for (const candidate of candidates.filter(span => !candidates.some(other =>
        other !== span && other.start >= span.start && other.end <= span.end))) {
          for (const word of words.slice(candidate.start, candidate.end)) {
            const key = `${word.bbox.x0},${word.bbox.y0},${word.bbox.x1},${word.bbox.y1}`
            if (!seen.has(key)) { seen.add(key); bboxes.push(word.bbox) }
          }
      }
    }

    const transformedBboxes = bboxes.map((box) => {
      let { x0, y0, x1, y1 } = box

      // 1. Reverse rotation
      if (rotation !== 0 && imgWidth > 0 && imgHeight > 0) {
        const scaledWidth = imgWidth * scale
        const scaledHeight = imgHeight * scale

        let canvasWidth = scaledWidth
        let canvasHeight = scaledHeight
        if (rotation === 90 || rotation === 270) {
          canvasWidth = scaledHeight
          canvasHeight = scaledWidth
        }

        const rx0 = x0 - canvasWidth / 2
        const ry0 = y0 - canvasHeight / 2
        const rx1 = x1 - canvasWidth / 2
        const ry1 = y1 - canvasHeight / 2

        const theta = (-rotation * Math.PI) / 180
        const cos = Math.cos(theta)
        const sin = Math.sin(theta)

        const pts = [
          { x: rx0 * cos - ry0 * sin, y: rx0 * sin + ry0 * cos },
          { x: rx1 * cos - ry0 * sin, y: rx1 * sin + ry0 * cos },
          { x: rx1 * cos - ry1 * sin, y: rx1 * sin + ry1 * cos },
          { x: rx0 * cos - ry1 * sin, y: rx0 * sin + ry1 * cos },
        ]

        const minX = Math.min(...pts.map((p) => p.x))
        const maxX = Math.max(...pts.map((p) => p.x))
        const minY = Math.min(...pts.map((p) => p.y))
        const maxY = Math.max(...pts.map((p) => p.y))

        x0 = minX + scaledWidth / 2
        x1 = maxX + scaledWidth / 2
        y0 = minY + scaledHeight / 2
        y1 = maxY + scaledHeight / 2
      }

      // 2. Reverse scaling
      return {
        x0: x0 / scale,
        y0: y0 / scale,
        x1: x1 / scale,
        y1: y1 / scale,
      }
    })

    return {
      ...entity,
      tier: 'ocr' as const,
      severity: upgradeSeverity(entity.severity, severityFloor),
      ...(transformedBboxes.length > 0 ? { bboxes: transformedBboxes } : {}),
    }
  })
}
