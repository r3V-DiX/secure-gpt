// ─────────────────────────────────────────────
// @securegpt/ocr — Ollama OCR Vision Engine Adapter
// Integrates local vision & OCR models (e.g., glm-ocr:q8_0, llama3.2-vision)
// ─────────────────────────────────────────────

import type {
  OcrEngine,
  OcrEngineOptions,
  OcrEngineResult,
  OcrWord,
  OcrBlock,
} from '../types'

export interface OllamaEngineConfig {
  baseUrl?: string
  model?: string
  timeoutMs?: number
  prompt?: string
}

export class OllamaOcrEngine implements OcrEngine {
  readonly name = 'ollama-ocr'
  private baseUrl: string
  private model: string
  private timeoutMs: number
  private prompt: string
  private ready: boolean = false

  constructor(config?: OllamaEngineConfig) {
    this.baseUrl = config?.baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
    this.model = config?.model || process.env.OLLAMA_OCR_MODEL || 'glm-ocr:q8_0'
    this.timeoutMs = config?.timeoutMs || 60000
    this.prompt =
      config?.prompt ||
      'Transcribe all text from this image accurately, completely, and verbatim. Output only the extracted text with original line breaks preserved. Do not include introductory remarks or markdown commentary.'
  }

  get isReady(): boolean {
    return this.ready
  }

  async initialize(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        this.ready = true
        return
      }
    } catch {}

    this.ready = false
    console.warn(
      `[@securegpt/ocr] Ollama server is not running on ${this.baseUrl}. Please start Ollama with 'ollama serve'.`
    )
  }

  async recognize(
    imageInput: string | ImageData,
    options?: OcrEngineOptions
  ): Promise<OcrEngineResult> {
    if (!this.ready) {
      await this.initialize()
    }

    if (!this.ready) {
      console.warn(`[@securegpt/ocr] Ollama engine not connected. Skipping image recognition.`)
      return { text: '', confidence: 0, words: [], blocks: [] }
    }

    let base64Image = ''

    if (typeof imageInput === 'string') {
      if (imageInput.startsWith('data:')) {
        base64Image = imageInput.replace(/^data:image\/\w+;base64,/, '')
      } else if (typeof process !== 'undefined' && Boolean(process.versions?.node)) {
        try {
          const fs = require('fs')
          if (fs.existsSync(imageInput)) {
            base64Image = fs.readFileSync(imageInput).toString('base64')
          } else {
            base64Image = imageInput
          }
        } catch {
          base64Image = imageInput
        }
      } else {
        base64Image = imageInput
      }
    }

    const modelToUse = (options as any)?.model || this.model

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          prompt: this.prompt,
          images: [base64Image],
          stream: false,
          options: {
            temperature: 0.0,
            num_predict: 2048,
          },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      })

      if (response.ok) {
        const json = (await response.json()) as { response?: string }
        const text = (json.response || '').trim()
        return this.formatOcrResult(text)
      } else {
        const errText = await response.text()
        console.warn(`[@securegpt/ocr] Ollama API error (${response.status}):`, errText)
      }
    } catch (httpErr) {
      console.warn(`[@securegpt/ocr] Ollama API call failed:`, httpErr)
    }

    return { text: '', confidence: 0, words: [], blocks: [] }
  }

  private formatOcrResult(text: string): OcrEngineResult {
    const words: OcrWord[] = []
    const blocks: OcrBlock[] = []

    // Clean any markdown code fences if model wrapped output in ```
    const cleanedText = text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim()
    const lines = cleanedText.split('\n')
    let lineIdx = 0

    for (const line of lines) {
      const lineWords = line.split(/\s+/).filter(Boolean)
      const lineOcrWords: OcrWord[] = lineWords.map((w, wIdx) => ({
        text: w,
        confidence: 98,
        bbox: { x0: wIdx * 20, y0: lineIdx * 20, x1: (wIdx + 1) * 20, y1: (lineIdx + 1) * 20 },
      }))

      words.push(...lineOcrWords)
      blocks.push({
        text: line,
        confidence: 98,
        bbox: { x0: 0, y0: lineIdx * 20, x1: 100, y1: (lineIdx + 1) * 20 },
        words: lineOcrWords,
      })
      lineIdx++
    }

    return {
      text: cleanedText,
      confidence: 98,
      words,
      blocks,
    }
  }

  async setParameters(_params: Record<string, any>): Promise<void> {}

  async terminate(): Promise<void> {
    this.ready = false
  }
}
