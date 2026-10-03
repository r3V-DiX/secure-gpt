import { describe, expect, it } from 'vitest'
import { pdfTextLayout } from '../../src/offscreen/document-pdf-text'

const item = (str: string, x: number, width: number) => ({ str, width, height: 10, transform: [10, 0, 0, 10, x, 30], fontName: 'test', hasEOL: false })
describe('PDF text coordinates', () => {
  it('joins contiguous identifier fragments and preserves every source box', () => {
    const { text, spans } = pdfTextLayout([item('mira@', 10, 25), item('example.test', 35, 60)], {}, (x, y) => [x * 2, 100 - y * 2])
    expect(text).toBe('mira@example.test')
    expect(spans.map(span => [span.start, span.end])).toEqual([[0, 5], [5, 17]])
    expect(spans[1]!.box).toEqual({ x0: 70, x1: 190, y0: 20, y1: 45 })
  })
  it('preserves word gaps and line breaks', () => {
    const { text } = pdfTextLayout([item('Name:', 10, 25), { ...item('Mira', 40, 20), hasEOL: true }, item('Private', 10, 35)], {}, (x, y) => [x, y])
    expect(text).toBe('Name: Mira\nPrivate')
  })
  it('maps rotated text using both axes and includes descenders', () => {
    const { spans } = pdfTextLayout([{ ...item('Private', 10, 35), transform: [0, 10, -10, 0, 50, 30] }], {}, (x, y) => [x, y])
    expect(spans[0]!.box).toEqual({ x0: 40, x1: 52.5, y0: 30, y1: 65 })
  })
})
