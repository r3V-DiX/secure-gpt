import { describe, it, expect } from 'vitest'
import {
  applyGrayscale,
  calculateMeanBrightness,
  invertPixels,
  rotatePixelBuffer,
} from '../src/preprocessor/filters'
import { calculateOtsuThreshold, applyOtsuBinarization } from '../src/preprocessor/otsuThreshold'
import { ImagePreprocessor } from '../src/preprocessor/imagePreprocessor'

describe('Image Preprocessor & Filters', () => {
  it('converts RGBA buffer to grayscale correctly', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255])
    const imgData = { width: 2, height: 1, data }
    applyGrayscale(imgData)

    // Pixel 0 (Red): 0.299 * 255 ~ 76
    expect(imgData.data[0]).toBe(76)
    expect(imgData.data[1]).toBe(76)
    expect(imgData.data[2]).toBe(76)
  })

  it('detects dark mode and inverts pixels', () => {
    // 2x2 dark image (all pixels ~30 brightness)
    const data = new Uint8ClampedArray([
      30, 30, 30, 255,  30, 30, 30, 255,
      30, 30, 30, 255,  30, 30, 30, 255,
    ])
    const imgData = { width: 2, height: 2, data }
    const mean = calculateMeanBrightness(imgData)
    expect(mean).toBeLessThan(120)

    invertPixels(imgData)
    expect(imgData.data[0]).toBe(225)
  })

  it('calculates Otsu threshold for bimodal distribution', () => {
    // 100 dark pixels (value 20) and 100 bright pixels (value 220)
    const hist = new Int32Array(256)
    hist[20] = 100
    hist[220] = 100

    const threshold = calculateOtsuThreshold(hist, 200)
    expect(threshold).toBeGreaterThanOrEqual(20)
    expect(threshold).toBeLessThanOrEqual(220)
  })

  it('applies Otsu binarization correctly', () => {
    const data = new Uint8ClampedArray([
      20, 20, 20, 255,
      220, 220, 220, 255,
    ])
    const imgData = { width: 2, height: 1, data }
    const res = applyOtsuBinarization(imgData)

    expect(res.threshold).toBeGreaterThanOrEqual(20)
    // Dark pixel becomes 0, bright pixel becomes 255
    expect(imgData.data[0]).toBe(0)
    expect(imgData.data[4]).toBe(255)
  })

  it('rotates pixel buffer by 90 and 180 degrees', () => {
    // 2x1 image: [P0, P1]
    const data = new Uint8ClampedArray([
      10, 10, 10, 255,  20, 20, 20, 255,
    ])
    const imgData = { width: 2, height: 1, data }

    // 90 deg rotation becomes 1x2 image
    const rot90 = rotatePixelBuffer(imgData, 90)
    expect(rot90.width).toBe(1)
    expect(rot90.height).toBe(2)

    // 180 deg rotation stays 2x1, reversed
    const rot180 = rotatePixelBuffer(imgData, 180)
    expect(rot180.width).toBe(2)
    expect(rot180.height).toBe(1)
    expect(rot180.data[0]).toBe(20)
    expect(rot180.data[4]).toBe(10)
  })

  it('runs full preprocessor pipeline on buffer', () => {
    const preprocessor = new ImagePreprocessor()
    const data = new Uint8ClampedArray([
      10, 10, 10, 255,  200, 200, 200, 255,
      10, 10, 10, 255,  200, 200, 200, 255,
    ])
    const imgData = { width: 2, height: 2, data }

    const result = preprocessor.processBuffer(imgData)
    expect(result.imageData.width).toBe(2)
    expect(result.imageData.height).toBe(2)
    expect(result.optimalThreshold).toBeGreaterThanOrEqual(0)
  })
})
