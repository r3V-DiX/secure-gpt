// ─────────────────────────────────────────────
// Native CLI TSV Parser Helper for Tesseract
// ─────────────────────────────────────────────

import type { OcrEngineOptions, OcrEngineResult, OcrWord } from '../types'

export function getNodeModules() {
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

export function parseTsvOutput(stdout: string): { text: string; confidence: number; words: OcrWord[] } {
  const lines = stdout.split('\n')
  const words: OcrWord[] = []
  const textLines: string[] = []
  let currentLineWords: string[] = []
  let lastLineNum = -1
  let totalConfidence = 0
  let wordCount = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue
    const cols = lines[i]!.split('\t')
    if (cols.length < 12) continue

    const level = cols[0]
    const lineNum = parseInt(cols[4] || '0', 10)
    const left = parseInt(cols[6] || '0', 10)
    const top = parseInt(cols[7] || '0', 10)
    const width = parseInt(cols[8] || '0', 10)
    const height = parseInt(cols[9] || '0', 10)
    const conf = parseFloat(cols[10] || '0')
    const wordText = cols[11]?.trim()

    if (level === '5' && wordText) {
      if (lastLineNum !== -1 && lineNum !== lastLineNum) {
        textLines.push(currentLineWords.join(' '))
        currentLineWords = []
      }
      lastLineNum = lineNum
      currentLineWords.push(wordText)

      const validConf = conf >= 0 ? conf : 85
      totalConfidence += validConf
      wordCount++

      words.push({
        text: wordText,
        confidence: validConf,
        bbox: {
          x0: left,
          y0: top,
          x1: left + width,
          y1: top + height,
        },
      })
    }
  }

  if (currentLineWords.length > 0) {
    textLines.push(currentLineWords.join(' '))
  }

  const fullText = textLines.join('\n')
  const avgConfidence = wordCount > 0 ? Math.round(totalConfidence / wordCount) : 85

  return { text: fullText, confidence: avgConfidence, words }
}

export async function runNativeTesseractCli(
  imageInput: string,
  language: string,
  options?: OcrEngineOptions
): Promise<OcrEngineResult> {
  const node = getNodeModules()
  if (!node) {
    return { text: '', confidence: 0, words: [], blocks: [] }
  }

  let sourcePath = imageInput
  let tempCreated = false

  if (imageInput.startsWith('data:')) {
    const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '')
    sourcePath = `/tmp/tess_in_${Date.now()}_${Math.random().toString(36).slice(2)}.png`
    node.fs.writeFileSync(sourcePath, Buffer.from(base64Data, 'base64'))
    tempCreated = true
  }

  try {
    const psmVal = options?.psm !== undefined ? String(options.psm) : '3'
    const args = [sourcePath, 'stdout', '-l', language, '--psm', psmVal, '--oem', '1', 'tsv']

    const { stdout } = await node.execFileAsync('tesseract', args)
    const parsed = parseTsvOutput(stdout)

    return {
      text: parsed.text,
      confidence: parsed.confidence,
      words: parsed.words,
      blocks: [],
    }
  } catch (nativeErr) {
    console.warn('[TesseractEngine] Native execution error:', nativeErr)
    return { text: '', confidence: 0, words: [], blocks: [] }
  } finally {
    if (tempCreated && node.fs.existsSync(sourcePath)) {
      try { node.fs.unlinkSync(sourcePath) } catch {}
    }
  }
}
