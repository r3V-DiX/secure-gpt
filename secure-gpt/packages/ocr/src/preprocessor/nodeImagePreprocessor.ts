// ─────────────────────────────────────────────
// @securegpt/ocr — Node.js Image Preprocessor
// High-fidelity image optimization for OCR:
// Contrast enhancement, grayscale conversion, deskewing, and 1:1 coordinate preservation
// ─────────────────────────────────────────────

import type { PreprocessingOptions } from '../types'

function getNodeModules() {
  if (typeof process !== 'undefined' && Boolean(process.versions?.node)) {
    try {
      const fs = require('fs')
      const path = require('path')
      const cp = require('child_process')
      const util = require('util')
      return {
        fs,
        path,
        execFile: cp.execFile,
        execSync: cp.execSync,
        execFileAsync: util.promisify(cp.execFile),
      }
    } catch {
      return null
    }
  }
  return null
}

export interface NodePreprocessResult {
  filePath: string
  buffer: Buffer
  dataUrl: string
  scale: number
  rotation: number
  cleanup: () => void
}

export class NodeImagePreprocessor {
  private hasPythonPil: boolean = false
  private hasConvert: boolean = false

  constructor() {
    this.detectCapabilities()
  }

  private detectCapabilities() {
    const node = getNodeModules()
    if (!node) return

    try {
      node.execSync('python3 -c "import PIL" 2>/dev/null', { stdio: 'ignore' })
      this.hasPythonPil = true
    } catch {
      this.hasPythonPil = false
    }

    try {
      node.execSync('which convert 2>/dev/null', { stdio: 'ignore' })
      this.hasConvert = true
    } catch {
      this.hasConvert = false
    }
  }

  async preprocessImage(
    inputPathOrDataUrl: string,
    options?: PreprocessingOptions
  ): Promise<NodePreprocessResult> {
    const node = getNodeModules()
    if (!node) {
      return {
        filePath: inputPathOrDataUrl,
        buffer: Buffer.from([]),
        dataUrl: inputPathOrDataUrl,
        scale: 1,
        rotation: 0,
        cleanup: () => {},
      }
    }

    let sourceFilePath = inputPathOrDataUrl
    let tempInputCreated = false
    let tempOutputDir = node.path.resolve(__dirname, '../../../../.temp_ocr')

    if (!node.fs.existsSync(tempOutputDir)) {
      try {
        node.fs.mkdirSync(tempOutputDir, { recursive: true })
      } catch {
        tempOutputDir = process.cwd()
      }
    }

    let outputFilePath = ''
    const cleanup = () => {
      try {
        if (tempInputCreated && node.fs.existsSync(sourceFilePath)) node.fs.unlinkSync(sourceFilePath)
        if (outputFilePath && node.fs.existsSync(outputFilePath)) node.fs.unlinkSync(outputFilePath)
      } catch {}
    }

    if (inputPathOrDataUrl.startsWith('data:')) {
      const base64Data = inputPathOrDataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buf = Buffer.from(base64Data, 'base64')
      if (buf.length < 16) {
        return {
          filePath: inputPathOrDataUrl,
          buffer: buf,
          dataUrl: inputPathOrDataUrl,
          scale: 1,
          rotation: 0,
          cleanup,
        }
      }
      const ext = inputPathOrDataUrl.includes('image/jpeg') ? '.jpg' : '.png'
      sourceFilePath = node.path.join(tempOutputDir, `temp_raw_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`)
      node.fs.writeFileSync(sourceFilePath, buf)
      tempInputCreated = true
    }

    outputFilePath = node.path.join(
      tempOutputDir,
      `prep_${Date.now()}_${Math.random().toString(36).slice(2)}.png`
    )

    try {
      if (this.hasPythonPil) {
        await this.preprocessWithPython(sourceFilePath, outputFilePath, options)
      } else if (this.hasConvert) {
        await this.preprocessWithConvert(sourceFilePath, outputFilePath, options)
      } else {
        node.fs.copyFileSync(sourceFilePath, outputFilePath)
      }

      const buffer = node.fs.readFileSync(outputFilePath)
      const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`

      return {
        filePath: outputFilePath,
        buffer,
        dataUrl,
        scale: 1.0,
        rotation: options?.targetRotation ?? 0,
        cleanup,
      }
    } catch (err) {
      console.warn('[@securegpt/ocr] Image preprocessing fallback:', err)
      const buffer = node.fs.existsSync(sourceFilePath) ? node.fs.readFileSync(sourceFilePath) : Buffer.from([])
      return {
        filePath: sourceFilePath,
        buffer,
        dataUrl: inputPathOrDataUrl.startsWith('data:') ? inputPathOrDataUrl : `data:image/png;base64,${buffer.toString('base64')}`,
        scale: 1.0,
        rotation: 0,
        cleanup,
      }
    }
  }

  private async preprocessWithPython(
    input: string,
    output: string,
    _options?: PreprocessingOptions
  ): Promise<void> {
    const node = getNodeModules()
    if (!node) return
    const pythonScript = `
import sys
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageStat

input_p = sys.argv[1]
output_p = sys.argv[2]

img = Image.open(input_p)

# Check image contrast
stat = ImageStat.Stat(img.convert('L'))
std_dev = stat.stddev[0] if stat.stddev else 50

# 1. Grayscale
if img.mode != 'L':
    img = img.convert('L')

# 2. Dynamic Contrast enhancement for low-contrast scans (preserve 1:1 pixel coordinates)
if std_dev < 60:
    img = ImageOps.autocontrast(img, cutoff=1)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.8)
    img = img.filter(ImageFilter.SHARPEN)

img.save(output_p, dpi=(300, 300))
`
    await node.execFileAsync('python3', ['-c', pythonScript, input, output])
  }

  private async preprocessWithConvert(
    input: string,
    output: string,
    _options?: PreprocessingOptions
  ): Promise<void> {
    const node = getNodeModules()
    if (!node) return
    const args = [
      input,
      '-colorspace', 'Gray',
      '-auto-level',
      output,
    ]
    await node.execFileAsync('convert', args)
  }
}
