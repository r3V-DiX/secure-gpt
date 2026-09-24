// ─────────────────────────────────────────────
// Mock OCR Engine
// Deterministic in-memory engine for high-speed unit & integration testing
// ─────────────────────────────────────────────

import type { OcrEngine, OcrEngineOptions, OcrEngineResult } from '../types'

export class MockOcrEngine implements OcrEngine {
  readonly name = 'mock'
  public isReady: boolean = false
  private presetText: string
  private presetConfidence: number

  constructor(presetText: string = '', presetConfidence: number = 95) {
    this.presetText = presetText
    this.presetConfidence = presetConfidence
  }

  setMockResponse(text: string, confidence: number = 95) {
    this.presetText = text
    this.presetConfidence = confidence
  }

  async initialize(): Promise<void> {
    this.isReady = true
  }

  async recognize(_imageInput: string | ImageData, _options?: OcrEngineOptions): Promise<OcrEngineResult> {
    const words = this.presetText.split(/\s+/).filter(Boolean).map((text, idx) => ({
      text,
      confidence: this.presetConfidence,
      bbox: {
        x0: idx * 50,
        y0: 10,
        x1: (idx + 1) * 50 - 5,
        y1: 30,
      },
    }))

    return {
      text: this.presetText,
      confidence: this.presetConfidence,
      words,
      blocks: [
        {
          text: this.presetText,
          confidence: this.presetConfidence,
          bbox: { x0: 0, y0: 10, x1: words.length * 50, y1: 30 },
          words,
        },
      ],
      raw: { text: this.presetText, words },
    }
  }

  async setParameters(_params: Record<string, any>): Promise<void> {}

  async terminate(): Promise<void> {
    this.isReady = false
  }
}
