// ─────────────────────────────────────────────
// WordPiece Tokeniser
// Lightweight BERT tokenisation for the browser
// ─────────────────────────────────────────────

/**
 * BERT WordPiece tokeniser implementation.
 * Maps text to token IDs for ONNX inference.
 */
export class WordPieceTokenizer {
  private vocab = new Map<string, number>()
  private idUnk = 100
  private idPad = 0

  constructor(vocabRaw: string) {
    vocabRaw.split('\n').forEach((line, index) => {
      const token = line.trim()
      if (token) this.vocab.set(token, index)
    })
    this.idUnk = this.vocab.get('[UNK]') ?? 100
    this.idPad = this.vocab.get('[PAD]') ?? 0
  }

  tokenize(text: string, maxLen = 128): {
    inputIds: BigInt64Array
    attentionMask: BigInt64Array
    tokenTypeIds: BigInt64Array
    tokens: string[]
    offsets: Array<[number, number]>
  } {
    const words = this.basicTokenize(text)
    const tokens: string[] = ['[CLS]']
    const offsets: Array<[number, number]> = [[0, 0]]

    for (const word of words) {
      const pieces = this.wordpieceSegment(word.value)
      let cursor = word.start
      for (const piece of pieces) {
        if (tokens.length >= maxLen - 1) break
        tokens.push(piece)
        const end = piece === '[UNK]' ? word.end : cursor + piece.replace(/^##/, '').length
        offsets.push([cursor, end])
        cursor = end
      }
      if (tokens.length >= maxLen - 1) break
    }

    tokens.push('[SEP]')
    offsets.push([0, 0])

    const inputIds = new BigInt64Array(maxLen).fill(BigInt(this.idPad))
    const attentionMask = new BigInt64Array(maxLen).fill(0n)
    const tokenTypeIds = new BigInt64Array(maxLen).fill(0n)

    for (let i = 0; i < Math.min(tokens.length, maxLen); i++) {
      const token = tokens[i]
      if (token !== undefined) {
        inputIds[i] = BigInt(this.vocab.get(token) ?? this.idUnk)
        attentionMask[i] = 1n
      }
    }

    // Pad tokens array to maxLen for consistent indexing
    while (tokens.length < maxLen) {
      tokens.push('[PAD]')
      offsets.push([0, 0])
    }

    return { inputIds, attentionMask, tokenTypeIds, tokens, offsets }
  }

  private basicTokenize(text: string): Array<{ value: string; start: number; end: number }> {
    const matches = text.matchAll(/[a-zA-Z0-9']+|[^a-zA-Z0-9'\s]/g)
    return Array.from(matches, (match) => ({
      value: match[0].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length,
    }))
  }

  private wordpieceSegment(word: string): string[] {
    if (this.vocab.has(word)) return [word]

    const pieces: string[] = []
    let start = 0

    while (start < word.length) {
      let end = word.length
      let found: string | null = null

      while (start < end) {
        const substr = start === 0
          ? word.slice(start, end)
          : '##' + word.slice(start, end)

        if (this.vocab.has(substr)) {
          found = substr
          break
        }
        end--
      }

      if (found === null) return ['[UNK]']
      pieces.push(found)
      start = end
    }

    return pieces
  }
}
