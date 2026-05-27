// ─────────────────────────────────────────────
// Tier 3 — OCR (Image Text Extraction)
// Extracts text from images and runs detection
// ─────────────────────────────────────────────

import { BaseTier } from '../base-tier'
import { getOcrWorker } from './ocrWorker'
import { classifyDocument, upgradeSeverity } from './ocrUtils'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import { normalizeText } from '@securegpt/shared/utils/detection-helpers'
import { RegexTier } from '../regex/regexTier'

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof Image !== 'undefined'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (src && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => {
      console.info('[OCRTier] Image loaded successfully. Size:', img.width, 'x', img.height)
      resolve(img)
    }
    img.onerror = (e) => {
      console.error('[OCRTier] Failed to load image in loadImage. Source starts with:', src ? src.slice(0, 50) : 'null', 'Error:', e)
      reject(e)
    }
    img.src = src
  })
}

function rotateImageCanvas(img: HTMLImageElement, degrees: number): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return img.src

  if (degrees === 90 || degrees === 270) {
    canvas.width = img.height
    canvas.height = img.width
  } else {
    canvas.width = img.width
    canvas.height = img.height
  }

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)

  return canvas.toDataURL('image/png')
}

export class OCRTier extends BaseTier {
  readonly name = 'ocr' as const
  readonly enabled = true

  override async initialize(): Promise<void> {
    await getOcrWorker()
  }

  async run(_text: string, _config: PIIConfig): Promise<PIIEntity[]> {
    return []
  }

  /**
   * Run OCR on image with optional sparse pass for PAN cards. Supports auto-rotation.
   */
  async runOnImage(imageUrl: string, config: PIIConfig): Promise<{
    rawText: string
    ocrData: any
    isConfidential: boolean
    severityFloor: any
    rotatedImageUrl?: string
  }> {
    const worker = await getOcrWorker()
    if (!worker) return { rawText: '', ocrData: null, isConfidential: false, severityFloor: 'medium' }

    try {
      console.info('[OCRTier] Processing image (First Pass)...')
      let { data } = await worker.recognize(imageUrl, {}, { blocks: true })
      let rawText = normalizeText(data.text)
      
      const { isConfidential, severityFloor } = classifyDocument(rawText)

      // --- SECOND PASS OPTIMIZATION FOR PAN CARDS ---
      // If no PAN card pattern is found in rawText, try PSM 11 (sparse text)
      if (!/\b([A-Z]{3}[PCHFATLJGE][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi.test(rawText)) {
        console.info('[OCRTier] No PAN found. Running Sparse Pass (PSM 11)...')
        await worker.setParameters({ tessedit_pageseg_mode: '11' as any })
        const { data: sparseData } = await worker.recognize(imageUrl, {}, { blocks: true })
        
        // Merge sparse text into rawText if it contains PAN-like patterns
        if (/\b([A-Z]{3}[PCHFATLJGE][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi.test(sparseData.text)) {
          console.info('[OCRTier] Found PAN in Sparse Pass.')
          rawText += '\n' + normalizeText(sparseData.text)
          // Merge word data for bbox mapping
          if ((data as any).words && (sparseData as any).words) {
            (data as any).words.push(...(sparseData as any).words)
          }
        }
        // Reset to AUTO
        await worker.setParameters({ tessedit_pageseg_mode: '3' as any })
      }

      console.info('[OCRTier] First Pass Extracted Text:', rawText)

      // Instantiate a RegexTier to check for findings
      const regexCheck = new RegexTier()
      const firstPassFindings = await regexCheck.run(rawText, config)

      // If we are in the browser, let's load the image to check dimensions and rotate if needed
      if (isBrowser) {
        try {
          console.info('[OCRTier] Loading image for orientation and rotation checks…')
          const img = await loadImage(imageUrl)
          const isPortrait = img.height > img.width
          const hasCriticalFinding = firstPassFindings.some(f => f.type === 'aadhaar' || f.type === 'pan_card')

          // If the image is portrait (likely rotated landscape ID card) or we didn't find critical PII, try rotations
          if (isPortrait || !hasCriticalFinding) {
            console.info(`[OCRTier] Running rotation checks (isPortrait: ${isPortrait}, hasCriticalFinding: ${hasCriticalFinding})…`)
            const rotations = [90, 270, 180]
            
            for (const deg of rotations) {
              console.info(`[OCRTier] Testing rotation: ${deg} degrees…`)
              const rotatedUrl = rotateImageCanvas(img, deg)
              const { data: rotatedData } = await worker.recognize(rotatedUrl, {}, { blocks: true })
              const rotatedText = normalizeText(rotatedData.text)

              // Optimize rotated pass for PAN cards too
              let finalRotatedText = rotatedText
              if (!/\b([A-Z]{3}[PCHFATLJGE][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi.test(finalRotatedText)) {
                await worker.setParameters({ tessedit_pageseg_mode: '11' as any })
                const { data: sparseRotatedData } = await worker.recognize(rotatedUrl, {}, { blocks: true })
                if (/\b([A-Z]{3}[PCHFATLJGE][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi.test(sparseRotatedData.text)) {
                  finalRotatedText += '\n' + normalizeText(sparseRotatedData.text)
                  if ((rotatedData as any).words && (sparseRotatedData as any).words) {
                    (rotatedData as any).words.push(...(sparseRotatedData as any).words)
                  }
                }
                await worker.setParameters({ tessedit_pageseg_mode: '3' as any })
              }

              const rotatedFindings = await regexCheck.run(finalRotatedText, config)
              console.info(`[OCRTier] Extracted text at ${deg} degrees (first 100 chars):`, finalRotatedText.slice(0, 100))
              console.info(`[OCRTier] Rotated findings count at ${deg} degrees:`, rotatedFindings.length)
              
              if (rotatedFindings.length > 0) {
                console.info(`[OCRTier] Successfully found PII at ${deg} degrees! Text length: ${finalRotatedText.length}`)
                const { isConfidential: rotConf, severityFloor: rotSev } = classifyDocument(finalRotatedText)
                return {
                  rawText: finalRotatedText,
                  ocrData: rotatedData,
                  isConfidential: rotConf,
                  severityFloor: rotSev,
                  rotatedImageUrl: rotatedUrl
                }
              }
            }
          }
        } catch (rotErr) {
          console.warn('[OCRTier] Rotation check encountered an error:', rotErr)
        }
      } else {
        // Node environment: if firstPassFindings > 0, return immediately
        if (firstPassFindings.length > 0) {
          return { rawText, ocrData: data, isConfidential, severityFloor }
        }
      }

      return { rawText, ocrData: data, isConfidential, severityFloor }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Unknown OCR error')
      console.error('[OCRTier] OCR failed:', msg)
      return { rawText: '', ocrData: null, isConfidential: false, severityFloor: 'medium' }
    }
  }

  mapEntitiesToBboxes(entities: PIIEntity[], ocrData: any, rawText: string, severityFloor: any): PIIEntity[] {
    if (!ocrData) return entities

    const words: any[] = ocrData.words ||
      ocrData.blocks?.flatMap((b: any) =>
        b.paragraphs?.flatMap((p: any) =>
          p.lines?.flatMap((l: any) => l.words || []) || []
        ) || []
      ) || []

    if (words.length === 0) {
      console.warn('[OCRTier] No words found in OCR data for bounding box mapping.')
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

    return entities.map(entity => {
      const bboxes: any[] = []
      const seen = new Set<string>()

      // 1. Try position-based mapping
      for (let i = entity.startIndex; i < entity.endIndex; i++) {
        const box = charBboxes[i]
        if (box) {
          const key = `${box.x0},${box.y0},${box.x1},${box.y1}`
          if (!seen.has(key)) {
            seen.add(key)
            bboxes.push(box)
          }
        }
      }

      // 2. Fallback: Value-based search in words
      if (bboxes.length === 0 && entity.value) {
        const needle = normalizeText(entity.value).replace(/[\s-]+/g, '').toLowerCase()
        if (needle.length > 3) { // Avoid single-char false positive explosion
          for (const word of words) {
            const haystack = normalizeText(word.text).replace(/[\s-]+/g, '').toLowerCase()
            if (haystack && (haystack.includes(needle) || needle.includes(haystack))) {
              const key = `${word.bbox.x0},${word.bbox.y0},${word.bbox.x1},${word.bbox.y1}`
              if (!seen.has(key)) {
                seen.add(key)
                bboxes.push(word.bbox)
              }
            }
          }
        }
      }

      console.info(`[OCRTier] Attached ${bboxes.length} bounding boxes to entity: ${entity.label}`)

      return {
        ...entity,
        tier: 'ocr' as const,
        severity: upgradeSeverity(entity.severity, severityFloor),
        ...(bboxes.length > 0 ? { bboxes } : {})
      }
    })
  }
}
