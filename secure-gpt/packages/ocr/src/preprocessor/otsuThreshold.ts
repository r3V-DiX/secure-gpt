// ─────────────────────────────────────────────
// Pure TypeScript Otsu's Global & Adaptive Binarization
// Maximizes inter-class variance between foreground and background pixels
// ─────────────────────────────────────────────

import type { ProcessedImageData } from '../types'

/**
 * Calculates the histogram of an 8-bit grayscale image.
 */
export function computeGrayscaleHistogram(data: Uint8ClampedArray): Int32Array {
  const histogram = new Int32Array(256)
  const totalPixels = data.length / 4

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4
    // Assume input is already grayscale or compute standard luminance
    const lum = Math.round(0.299 * data[idx]! + 0.587 * data[idx + 1]! + 0.114 * data[idx + 2]!)
    histogram[lum] = (histogram[lum] || 0) + 1
  }

  return histogram
}

/**
 * Computes Otsu's optimal global threshold.
 * Returns a threshold value between [0, 255].
 */
export function calculateOtsuThreshold(histogram: Int32Array, totalPixels: number): number {
  if (totalPixels === 0) return 128

  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i]!
  }

  let sumB = 0
  let wB = 0
  let wF = 0
  let varMax = 0
  let optimalThreshold = 128

  for (let t = 0; t < 256; t++) {
    wB += histogram[t]!
    if (wB === 0) continue

    wF = totalPixels - wB
    if (wF === 0) break

    sumB += t * histogram[t]!
    const mB = sumB / wB
    const mF = (sum - sumB) / wF

    // Between-class variance
    const varBetween = wB * wF * (mB - mF) * (mB - mF)

    if (varBetween > varMax) {
      varMax = varBetween
      optimalThreshold = t
    }
  }

  return optimalThreshold
}

/**
 * Applies Otsu binarization in-place to an RGBA pixel buffer.
 */
export function applyOtsuBinarization(
  imageData: ProcessedImageData,
  customThreshold?: number
): { threshold: number } {
  const { data, width, height } = imageData
  const totalPixels = width * height
  const histogram = computeGrayscaleHistogram(data)
  const threshold = customThreshold !== undefined ? customThreshold : calculateOtsuThreshold(histogram, totalPixels)

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4
    const gray = 0.299 * data[idx]! + 0.587 * data[idx + 1]! + 0.114 * data[idx + 2]!
    const binVal = gray > threshold ? 255 : 0

    data[idx] = binVal
    data[idx + 1] = binVal
    data[idx + 2] = binVal
    data[idx + 3] = 255
  }

  return { threshold }
}
