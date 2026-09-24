// ─────────────────────────────────────────────
// @securegpt/ocr — Types & Interfaces
// ─────────────────────────────────────────────

import type { Severity } from '@securegpt/shared/types'

export interface OcrBoundingBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface OcrWord {
  text: string
  confidence: number
  bbox: OcrBoundingBox
  baseline?: { x0: number; y0: number; x1: number; y1: number }
}

export interface OcrBlock {
  text: string
  confidence: number
  bbox: OcrBoundingBox
  words: OcrWord[]
}

export interface OcrEngineResult {
  text: string
  confidence: number
  words: OcrWord[]
  blocks?: OcrBlock[]
  raw?: any
}

export interface OcrEngineOptions {
  psm?: number | string
  dpi?: number
  language?: string
  whitelist?: string
  preserveInterwordSpaces?: boolean
}

export interface OcrEngine {
  readonly name: string
  readonly isReady: boolean
  initialize(): Promise<void>
  recognize(imageInput: string | ImageData, options?: OcrEngineOptions): Promise<OcrEngineResult>
  setParameters(params: Record<string, any>): Promise<void>
  terminate(): Promise<void>
}

export interface PreprocessingOptions {
  enableOtsu?: boolean
  enableAutoInvert?: boolean
  enableSharpening?: boolean
  enableContrastStretch?: boolean
  upscaleThreshold?: number
  scaleFactor?: number
  targetRotation?: number
}

export interface ProcessedImageData {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface ProcessedImageResult {
  url?: string
  imageData: ProcessedImageData
  scale: number
  rotation: number
  isDarkMode: boolean
  optimalThreshold: number
}

export interface OcrPipelineOptions {
  engine?: OcrEngine
  preprocessing?: PreprocessingOptions
  enableSparsePass?: boolean
  enableRotationChecks?: boolean
  rotationsToTest?: number[]
}

export interface OcrPipelineResult {
  rawText: string
  repairedText: string
  ocrData: OcrEngineResult
  isConfidential: boolean
  severityFloor: Severity
  scale: number
  rotation: number
  imgWidth: number
  imgHeight: number
  processedUrl?: string
  confidence: number
}
