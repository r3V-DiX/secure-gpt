// ─────────────────────────────────────────────
// Masking Service
// Replaces detected PII with placeholder tokens
// and redraws images with sensitive regions blacked out
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

/**
 * Applies masking to an image by drawing filled black rectangles over the
 * bounding boxes of detected entities on an offscreen canvas.
 * Returns a redacted PNG data URL safe to forward to the LLM platform.
 *
 * Each entity must carry a `bboxes` field of shape `{ x0, y0, x1, y1 }[]`
 * (provided by the OCR tier after `detectPIIFromImage`).
 *
 * Privacy: the original image is only held in memory during this call and
 * is never written to disk or sent over the network.
 */
export function applyImageMasking(
  imageUrl: string,
  entities: PIIEntity[]
): Promise<string> {
  const bboxes = entities.flatMap((e) => (e as PIIEntity & { bboxes?: { x0: number; y0: number; x1: number; y1: number }[] }).bboxes ?? [])
  console.info(`[SecureGPT Masking] Applying image mask with ${bboxes.length} bounding box(es).`)

  if (!entities.length || entities.some(entity => !entity.bboxes?.length)) {
    return Promise.reject(new Error('DOCUMENT_MISSING_REDACTION_BOXES'))
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
      console.info(`[SecureGPT Masking] Image loaded (${img.width}×${img.height}). Redacting…`)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('DOCUMENT_CANVAS_UNAVAILABLE'))
        return
      }

      if (bboxes.some(box => ![box.x0, box.y0, box.x1, box.y1].every(Number.isFinite) ||
          box.x1 <= box.x0 || box.y1 <= box.y0 || box.x0 < 0 || box.y0 < 0 ||
          box.x1 > img.width || box.y1 > img.height)) {
        reject(new Error('DOCUMENT_INVALID_REDACTION_BOXES'))
        return
      }
      // Draw the original image
      ctx.drawImage(img, 0, 0)

      // Overlay black redaction boxes (with 2px padding)
      ctx.fillStyle = 'black'
      for (const box of bboxes) {
        const w = box.x1 - box.x0
        const h = box.y1 - box.y0
        ctx.fillRect(box.x0 - 2, box.y0 - 2, w + 4, h + 4)
      }

      const result = canvas.toDataURL('image/png')
      if (!result.startsWith('data:image/png;base64,')) throw new Error('DOCUMENT_REDACTION_FAILED')
      resolve(result)
      } catch {
        reject(new Error('DOCUMENT_REDACTION_FAILED'))
      }
    }
    img.onerror = () => {
      reject(new Error('DOCUMENT_IMAGE_LOAD_FAILED'))
    }
    img.src = imageUrl
  })
}
