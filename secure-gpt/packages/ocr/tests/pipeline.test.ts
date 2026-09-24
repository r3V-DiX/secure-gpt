import { describe, it, expect } from 'vitest'
import { OcrPipeline } from '../src/pipeline/ocrPipeline'
import { MockOcrEngine } from '../src/engines/mockEngine'
import { mapEntitiesToBboxes } from '../src/postprocessor/bboxMapper'
import type { PIIEntity } from '@securegpt/shared/types'

describe('OcrPipeline & Bounding Box Mapping', () => {
  it('executes end-to-end pipeline with MockOcrEngine', async () => {
    const mockEngine = new MockOcrEngine('INCOME TAX DEPARTMENT PAN: ABCPE1234F')
    const pipeline = new OcrPipeline({ engine: mockEngine })

    await pipeline.initialize()
    expect(pipeline.isReady).toBe(true)

    const result = await pipeline.processImage('data:image/png;base64,mock')
    expect(result.rawText).toContain('ABCPE1234F')
    expect(result.isConfidential).toBe(true)
    expect(result.severityFloor).toBe('high')
    expect(result.ocrData.words.length).toBeGreaterThan(0)
  })

  it('maps detected entities to word bounding boxes with coordinate transformation', () => {
    const mockOcrData = {
      text: 'User PAN is ABCPE1234F recorded',
      words: [
        { text: 'User', bbox: { x0: 10, y0: 10, x1: 50, y1: 30 } },
        { text: 'PAN', bbox: { x0: 55, y0: 10, x1: 90, y1: 30 } },
        { text: 'is', bbox: { x0: 95, y0: 10, x1: 110, y1: 30 } },
        { text: 'ABCPE1234F', bbox: { x0: 120, y0: 10, x1: 200, y1: 30 } },
        { text: 'recorded', bbox: { x0: 205, y0: 10, x1: 280, y1: 30 } },
      ],
    }

    const entities: PIIEntity[] = [
      {
        id: 'test-1',
        ruleId: 'pan',
        type: 'pan_card',
        label: 'PAN Card',
        category: 'financial',
        value: 'ABCPE1234F',
        maskedValue: 'ABC*****F',
        startIndex: 12,
        endIndex: 22,
        tier: 'ocr',
        severity: 'high',
        confidence: 0.95,
      },
    ]

    const mapped = mapEntitiesToBboxes(
      entities,
      mockOcrData,
      'User PAN is ABCPE1234F recorded',
      'high',
      2 // 2x scaled image
    )

    expect(mapped.length).toBe(1)
    expect(mapped[0]!.bboxes).toBeDefined()
    expect(mapped[0]!.bboxes!.length).toBeGreaterThan(0)
    // Scale reversal: x0: 120 / 2 = 60
    expect(mapped[0]!.bboxes![0]!.x0).toBe(60)
  })
})
