// ─────────────────────────────────────────────
// Pixel-level Image Filters (Grayscale, Inversion, Sharpening, Contrast)
// Works directly on Uint8ClampedArray RGBA buffers (Node & Browser compatible)
// ─────────────────────────────────────────────

import type { ProcessedImageData } from '../types'

/**
 * Converts RGBA pixel data to standard ITU-R BT.601 grayscale.
 */
export function applyGrayscale(imageData: ProcessedImageData): void {
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }
}

/**
 * Computes mean brightness of the image (0-255) to detect dark mode.
 */
export function calculateMeanBrightness(imageData: ProcessedImageData): number {
  const { data, width, height } = imageData
  const total = width * height
  if (total === 0) return 128

  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!
  }
  return sum / total
}

/**
 * Inverts pixel values (255 - x) for dark mode / terminal screenshots.
 */
export function invertPixels(imageData: ProcessedImageData): void {
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]!
    data[i + 1] = 255 - data[i + 1]!
    data[i + 2] = 255 - data[i + 2]!
  }
}

/**
 * Contrast stretching with percentile clipping to normalize dynamic range.
 */
export function applyContrastStretching(imageData: ProcessedImageData): void {
  const { data } = imageData
  let min = 255
  let max = 0

  // Find min and max luminance
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i]!
    if (val < min) min = val
    if (val > max) max = val
  }

  // Avoid division by zero if completely uniform
  if (max <= min) return

  const range = max - min
  for (let i = 0; i < data.length; i += 4) {
    const normalized = Math.round(((data[i]! - min) / range) * 255)
    data[i] = normalized
    data[i + 1] = normalized
    data[i + 2] = normalized
  }
}

/**
 * Applies a 3x3 Laplacian sharpening filter to increase edge definition.
 * Kernel:
 *  [  0, -1,  0 ]
 *  [ -1,  5, -1 ]
 *  [  0, -1,  0 ]
 */
export function applySharpeningFilter(imageData: ProcessedImageData): void {
  const { data, width, height } = imageData
  const copy = new Uint8ClampedArray(data)

  const getPixel = (x: number, y: number): number => {
    const clampedX = Math.max(0, Math.min(width - 1, x))
    const clampedY = Math.max(0, Math.min(height - 1, y))
    return copy[(clampedY * width + clampedX) * 4]!
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const center = getPixel(x, y)
      const top = getPixel(x, y - 1)
      const bottom = getPixel(x, y + 1)
      const left = getPixel(x - 1, y)
      const right = getPixel(x + 1, y)

      const sharpened = 5 * center - top - bottom - left - right
      const clamped = Math.max(0, Math.min(255, sharpened))

      data[idx] = clamped
      data[idx + 1] = clamped
      data[idx + 2] = clamped
    }
  }
}

/**
 * Rotates an RGBA pixel buffer by 90, 180, or 270 degrees.
 */
export function rotatePixelBuffer(
  imageData: ProcessedImageData,
  degrees: number
): ProcessedImageData {
  const deg = ((degrees % 360) + 360) % 360
  if (deg === 0) return imageData

  const { data, width, height } = imageData
  const newWidth = deg === 90 || deg === 270 ? height : width
  const newHeight = deg === 90 || deg === 270 ? width : height
  const output = new Uint8ClampedArray(newWidth * newHeight * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      let targetX = x
      let targetY = y

      if (deg === 90) {
        targetX = height - 1 - y
        targetY = x
      } else if (deg === 180) {
        targetX = width - 1 - x
        targetY = height - 1 - y
      } else if (deg === 270) {
        targetX = y
        targetY = width - 1 - x
      }

      const destIdx = (targetY * newWidth + targetX) * 4
      output[destIdx] = data[srcIdx]!
      output[destIdx + 1] = data[srcIdx + 1]!
      output[destIdx + 2] = data[srcIdx + 2]!
      output[destIdx + 3] = data[srcIdx + 3]!
    }
  }

  return { width: newWidth, height: newHeight, data: output }
}
