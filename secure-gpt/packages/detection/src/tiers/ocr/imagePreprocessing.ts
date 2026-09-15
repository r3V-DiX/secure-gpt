// ─────────────────────────────────────────────
// OCR Image Preprocessing & Canvas Utilities
// ─────────────────────────────────────────────

export function loadImage(src: string): Promise<HTMLImageElement> {
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

export function rotateImageCanvas(img: HTMLImageElement, degrees: number): string {
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

export function preprocessImageCanvas(img: HTMLImageElement): { url: string; scale: number } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { url: img.src, scale: 1 }

  // Scale up small images for better OCR resolution (under 1000px)
  const scale = img.width < 1000 || img.height < 1000 ? 2 : 1
  canvas.width = img.width * scale
  canvas.height = img.height * scale

  // Disable smoothing for sharp edges during resize
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imgData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!
      const g = data[i + 1]!
      const b = data[i + 2]!

      // Grayscale conversion using standard luminance weights
      const grayscale = 0.299 * r + 0.587 * g + 0.114 * b

      // Adaptive Binarization: Threshold at 128
      const thresholdVal = grayscale > 128 ? 255 : 0

      data[i] = thresholdVal
      data[i + 1] = thresholdVal
      data[i + 2] = thresholdVal
    }

    ctx.putImageData(imgData, 0, 0)
  } catch (e) {
    console.warn('[OCRTier] Failed to apply pixel-level preprocessing filters (likely CORS limit):', e)
  }

  return { url: canvas.toDataURL('image/png'), scale }
}
