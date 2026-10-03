interface TextItem {
  str: string; transform: number[]; width: number; height: number; fontName: string; hasEOL: boolean
}
interface TextStyle { ascent?: number; descent?: number }
export interface PdfTextSpan { start: number; end: number; box: { x0: number; y0: number; x1: number; y1: number } }

/** Preserve adjacent text fragments and transform every corner, including rotated text. */
export function pdfTextLayout(items: TextItem[], styles: Record<string, TextStyle>,
  point: (x: number, y: number) => number[]): { text: string; spans: PdfTextSpan[] } {
  let text = ''
  const spans: PdfTextSpan[] = []
  let previous: { endX: number; endY: number; ux: number; uy: number; size: number; eol: boolean } | undefined
  for (const item of items) {
    const [a = 0, b = 0, c = 0, d = 0, x = 0, y = 0] = item.transform
    const horizontal = Math.hypot(a, b)
    const size = Math.hypot(c, d) || item.height
    if (!horizontal || !size) {
      if (item.str.trim()) throw new Error('DOCUMENT_TEXT_COORDINATES_MISSING')
      continue
    }
    const ux = a / horizontal; const uy = b / horizontal
    const vx = c / size; const vy = d / size
    if (previous && !/\s$/.test(text) && !/^\s/.test(item.str)) {
      const dx = x - previous.endX; const dy = y - previous.endY
      const lineDistance = Math.abs(dx * previous.uy - dy * previous.ux)
      const gap = dx * previous.ux + dy * previous.uy
      if (previous.eol || lineDistance > previous.size * .5) text += '\n'
      else if (gap > previous.size * .15) text += ' '
    }
    const start = text.length
    text += item.str
    const style = styles[item.fontName]
    const ascent = style?.ascent ?? 1
    const descent = style?.descent ?? -.25
    const corners = [0, item.width].flatMap(width => [descent, ascent].map(height =>
      point(x + ux * width + vx * size * height, y + uy * width + vy * size * height)))
    spans.push({ start, end: text.length, box: {
      x0: Math.min(...corners.map(p => p[0]!)), y0: Math.min(...corners.map(p => p[1]!)),
      x1: Math.max(...corners.map(p => p[0]!)), y1: Math.max(...corners.map(p => p[1]!)),
    } })
    previous = { endX: x + ux * item.width, endY: y + uy * item.width, ux, uy, size, eol: item.hasEOL }
  }
  return { text, spans }
}
