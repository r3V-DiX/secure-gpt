// ─────────────────────────────────────────────
// Backward Compatibility Shim -> @securegpt/ocr/preprocessor
// ─────────────────────────────────────────────

export {
  loadImageElement as loadImage,
  rotateImageCanvas,
  ImagePreprocessor,
} from '@securegpt/ocr'

import { ImagePreprocessor } from '@securegpt/ocr'

const preprocessor = new ImagePreprocessor()

export function preprocessImageCanvas(img: HTMLImageElement): { url: string; scale: number } {
  const result = (preprocessor as any).processBuffer
    ? preprocessor.processBuffer({
        width: img.width,
        height: img.height,
        data: new Uint8ClampedArray(img.width * img.height * 4),
      })
    : { url: img.src, scale: 1 }

  return { url: result.url || img.src, scale: 1 }
}
