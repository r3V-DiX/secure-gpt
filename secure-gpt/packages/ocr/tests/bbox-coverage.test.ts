import { describe, expect, it } from 'vitest'
import { mapEntitiesToBboxes } from '../src/postprocessor/bboxMapper'
import type { PIIEntity } from '@securegpt/shared/types'

const finding = (value: string, startIndex: number, endIndex = startIndex + value.length) =>
  ({ value, startIndex, endIndex, severity: 'high' } as PIIEntity)
const box = { x0: 10, y0: 20, x1: 40, y1: 30 }

describe('complete OCR coordinate provenance', () => {
  it('maps repaired appended values to only the original identifier words', () => {
    const raw = 'Reference ABCPEI234F recorded\nABCPE1234F'
    const words = ['Reference', 'ABCPEI234F', 'recorded'].map((text, index) => ({ text, bbox: { ...box, x0: index * 50, x1: index * 50 + 40 } }))
    const result = mapEntitiesToBboxes([finding('ABCPE1234F', raw.lastIndexOf('ABCPE1234F'))], { words }, raw)
    expect(result[0]!.bboxes).toEqual([words[1]!.bbox])
  })
  it('does not accept a partial box as coverage of the whole finding', () => {
    const result = mapEntitiesToBboxes([finding('alice@example.test', 0)], { words: [{ text: 'alice', bbox: box }] }, 'alice@example.test')
    expect(result[0]!.bboxes).toBeUndefined()
  })
  it.each([
    [90, { x0: 20, y0: 60, x1: 30, y1: 90 }],
    [270, { x0: 170, y0: 10, x1: 180, y1: 40 }],
  ])('reverses %i degree rotation into original image coordinates', (rotation, expected) => {
    const result = mapEntitiesToBboxes([finding('private', 0)], { words: [{ text: 'private', bbox: box }] }, 'private', 'high', 1, rotation, 200, 100)
    for (const key of ['x0', 'y0', 'x1', 'y1'] as const) expect(result[0]!.bboxes![0]![key]).toBeCloseTo(expected[key])
  })
})
