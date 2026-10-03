// ─────────────────────────────────────────────
// Universal Image Preprocessor
// Supports both Browser (Canvas/Otsu) and Node.js environments (Native filters / Python / ImageMagick)
// ─────────────────────────────────────────────

import type { PreprocessingOptions, ProcessedImageData, ProcessedImageResult } from '../types'
import {
  applyGrayscale,
  calculateMeanBrightness,
  invertPixels,
  applyContrastStretching,
  applySharpeningFilter,
  rotatePixelBuffer,
} from './filters'
import { applyOtsuBinarization } from './otsuThreshold'
import { extractImageDataFromElement, imageDataToDataUrl, loadImageElement } from './canvasAdapter'
import { NodeImagePreprocessor } from './nodeImagePreprocessor'

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

export class ImagePreprocessor {
  private defaultOptions: Required<PreprocessingOptions> = {
    enableOtsu: false,
    enableAutoInvert: true,
    enableSharpening: false,
    enableContrastStretch: true,
    upscaleThreshold: 1000,
    scaleFactor: 2,
    targetRotation: 0,
  }

  private nodePreprocessor: NodeImagePreprocessor | null = null

  constructor() {
    if (!isBrowser) {
      this.nodePreprocessor = new NodeImagePreprocessor()
    }
  }

  /**
   * Preprocesses a raw RGBA ProcessedImageData buffer in-place or copies.
   */
  processBuffer(
    input: ProcessedImageData,
    options?: PreprocessingOptions
  ): ProcessedImageResult {
    const opts = { ...this.defaultOptions, ...options }
    let currentData: ProcessedImageData = {
      width: input.width,
      height: input.height,
      data: new Uint8ClampedArray(input.data),
    }

    // 1. Grayscale conversion
    applyGrayscale(currentData)

    // 2. Mean brightness check & Dark Mode Auto-Inversion
    const meanBrightness = calculateMeanBrightness(currentData)
    const isDarkMode = meanBrightness < 120
    if (opts.enableAutoInvert && isDarkMode) {
      invertPixels(currentData)
    }

    // 3. Contrast Stretching (dynamic range normalization)
    if (opts.enableContrastStretch) {
      applyContrastStretching(currentData)
    }

    // 4. Laplacian Sharpening
    if (opts.enableSharpening) {
      applySharpeningFilter(currentData)
    }

    // 5. Otsu's Global Adaptive Binarization
    let optimalThreshold = 128
    if (opts.enableOtsu) {
      const res = applyOtsuBinarization(currentData)
      optimalThreshold = res.threshold
    }

    // 6. Target Rotation if requested
    let rotation = 0
    if (opts.targetRotation && opts.targetRotation !== 0) {
      currentData = rotatePixelBuffer(currentData, opts.targetRotation)
      rotation = opts.targetRotation
    }

    const url = imageDataToDataUrl(currentData)

    return {
      ...(url ? { url } : {}),
      imageData: currentData,
      scale: 1,
      rotation,
      isDarkMode,
      optimalThreshold,
    }
  }

  /**
   * Preprocesses an image URL, base64 string, or file path.
   */
  async processUrl(
    imageUrl: string,
    options?: PreprocessingOptions
  ): Promise<ProcessedImageResult> {
    const opts = { ...this.defaultOptions, ...options }

    if (!isBrowser && this.nodePreprocessor) {
      const nodeRes = await this.nodePreprocessor.preprocessImage(imageUrl, opts)
      return {
        url: nodeRes.dataUrl,
        imageData: { width: 0, height: 0, data: new Uint8ClampedArray(0) },
        scale: nodeRes.scale,
        rotation: nodeRes.rotation,
        isDarkMode: false,
        optimalThreshold: 128,
      }
    }

    try {
      const img = await loadImageElement(imageUrl)
      const scale = Math.max(img.width, img.height) < opts.upscaleThreshold
        ? opts.scaleFactor
        : 1

      // Coordinates map back by scale/rotation only; do not introduce an
      // untracked border offset into every redaction box.
      const { imageData } = extractImageDataFromElement(img, scale, 0)
      const processed = this.processBuffer(imageData, opts)

      return {
        ...processed,
        scale,
      }
    } catch (err) {
      // Return safe fallback
      return {
        url: imageUrl,
        imageData: { width: 0, height: 0, data: new Uint8ClampedArray(0) },
        scale: 1,
        rotation: 0,
        isDarkMode: false,
        optimalThreshold: 128,
      }
    }
  }
}
