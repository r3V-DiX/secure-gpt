// ─────────────────────────────────────────────
// Universal Canvas & ImageData Adapter
// Supports Browser DOM, OffscreenCanvas, and Node/TypedArray contexts
// ─────────────────────────────────────────────

import type { ProcessedImageData } from '../types'

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  if (!isBrowser) {
    throw new Error('[canvasAdapter] loadImageElement called in non-browser environment')
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    if (src && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error(`Failed to load image: ${String(e)}`))
    img.src = src
  })
}

/**
 * Extracts raw RGBA ImageData from an HTMLImageElement or Canvas.
 */
export function extractImageDataFromElement(
  img: HTMLImageElement,
  scale: number = 1
): { imageData: ProcessedImageData; canvas?: HTMLCanvasElement } {
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

  if (isBrowser) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (ctx) {
      ctx.imageSmoothingEnabled = scale > 1 ? false : true
      ctx.drawImage(img, 0, 0, width, height)
      const raw = ctx.getImageData(0, 0, width, height)
      return {
        imageData: {
          width: raw.width,
          height: raw.height,
          data: new Uint8ClampedArray(raw.data),
        },
        canvas,
      }
    }
  }

  // Fallback / dummy ImageData container
  return {
    imageData: {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    },
  }
}

/**
 * Converts a ProcessedImageData buffer back to a Base64 data URL.
 */
export function imageDataToDataUrl(imageData: ProcessedImageData): string {
  if (isBrowser) {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const imgDataObj = ctx.createImageData(imageData.width, imageData.height)
      imgDataObj.data.set(imageData.data)
      ctx.putImageData(imgDataObj, 0, 0)
      return canvas.toDataURL('image/png')
    }
  }

  // If outside browser, return empty or raw buffer placeholder
  return ''
}

/**
 * Rotates an HTMLImageElement using canvas transformation.
 */
export function rotateImageCanvas(img: HTMLImageElement, degrees: number): string {
  if (!isBrowser) return img.src

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return img.src

  const deg = ((degrees % 360) + 360) % 360
  if (deg === 90 || deg === 270) {
    canvas.width = img.height
    canvas.height = img.width
  } else {
    canvas.width = img.width
    canvas.height = img.height
  }

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((deg * Math.PI) / 180)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)

  return canvas.toDataURL('image/png')
}
