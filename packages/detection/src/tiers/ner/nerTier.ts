// ─────────────────────────────────────────────
// Tier 2 — NER (Named Entity Recognition)
// Irreversible detection via ONNX Runtime Web
// ─────────────────────────────────────────────

// ONNX load moved to worker
import { BaseTier } from '../base-tier'
import { WordPieceTokenizer } from './wordpieceTok'
// @ts-ignore
import NERWorkerUrl from '../../workers/ner.worker?worker&url'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'
// Handled by vite?raw or custom loader
import vocabRaw from './vocab.txt?raw'

const LABEL_MAP: Record<number, string> = {
  0: "B-BOD", 1: "B-BUILDING", 2: "B-CITY", 3: "B-COUNTRY", 4: "B-DATE",
  5: "B-DRIVERLICENSE", 6: "B-EMAIL", 7: "B-GEOCOORD", 8: "B-GIVENNAME1",
  9: "B-GIVENNAME2", 10: "B-IDCARD", 11: "B-IP", 12: "B-LASTNAME1",
  13: "B-LASTNAME2", 14: "B-LASTNAME3", 15: "B-PASS", 16: "B-PASSPORT",
  17: "B-POSTCODE", 18: "B-SECADDRESS", 19: "B-SEX", 20: "B-SOCIALNUMBER",
  21: "B-STATE", 22: "B-STREET", 23: "B-TEL", 24: "B-TIME", 25: "B-TITLE",
  26: "B-USERNAME", 27: "I-BOD", 28: "I-BUILDING", 29: "I-CITY", 30: "I-COUNTRY",
  31: "I-DATE", 32: "I-DRIVERLICENSE", 33: "I-EMAIL", 34: "I-GEOCOORD",
  35: "I-GIVENNAME1", 36: "I-GIVENNAME2", 37: "I-IDCARD", 38: "I-IP",
  39: "I-LASTNAME1", 40: "I-LASTNAME2", 41: "I-LASTNAME3", 42: "I-PASS",
  43: "I-PASSPORT", 44: "I-POSTCODE", 45: "I-SECADDRESS", 46: "I-SEX",
  47: "I-SOCIALNUMBER", 48: "I-STATE", 49: "I-STREET", 50: "I-TEL",
  51: "I-TIME", 52: "I-TITLE", 53: "I-USERNAME", 54: "O"
}

const HIGH_PRIORITY_LABELS = new Set([
  'B-EMAIL', 'I-EMAIL', 'B-IDCARD', 'I-IDCARD', 'B-PASSPORT', 'I-PASSPORT',
  'B-SOCIALNUMBER', 'I-SOCIALNUMBER', 'B-DRIVERLICENSE', 'I-DRIVERLICENSE'
])

const MEDIUM_PRIORITY_LABELS = new Set([
  'B-TEL', 'I-TEL', 'B-STREET', 'I-STREET', 'B-GIVENNAME1', 'B-LASTNAME1', 'B-DATE'
])

type WorkerState =
  | { status: 'unloaded' }
  | { status: 'loading'; promise: Promise<Worker | null> }
  | { status: 'ready'; worker: Worker }
  | { status: 'unavailable' }

export class NERTier extends BaseTier {
  readonly name = 'ner' as const
  readonly enabled = true

  private workerState: WorkerState = { status: 'unloaded' }
  private tokenizer: WordPieceTokenizer | null = null
  private readonly maxSeqLen = 128
  private reqId = 0
  private pendingRequests = new Map<number, { resolve: (val: number[] | null) => void, reject: (err: any) => void }>()

  override async initialize(): Promise<void> {
    await this.getWorker()
  }

  private async getWorker(): Promise<Worker | null> {
    if (this.workerState.status === 'ready') return this.workerState.worker
    if (this.workerState.status === 'unavailable') return null

    if (this.workerState.status === 'unloaded') {
      const promise = this.loadWorker().then((w) => {
        if (w) {
          this.workerState = { status: 'ready', worker: w }
        } else {
          this.workerState = { status: 'unavailable' }
        }
        return w
      })
      this.workerState = { status: 'loading', promise }
      return promise
    }

    return (this.workerState as any).promise
  }

  private async loadWorker(): Promise<Worker | null> {
    try {
      console.log('[NERTier] Starting worker initialization...')
      this.tokenizer = new WordPieceTokenizer(vocabRaw)
      console.log('[NERTier] Tokenizer ready')

      // Initialize worker
      console.log('[NERTier] Worker URL:', NERWorkerUrl)
      const worker = new Worker(NERWorkerUrl, { type: 'module' })
      
      // Wait for READY message
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          worker.removeEventListener('message', initListener)
          reject(new Error('NER Worker initialization timed out after 10s'))
        }, 10000)

        const initListener = (e: MessageEvent) => {
          console.log('[NERTier] Received init message:', e.data)
          if (e.data.type === 'READY') {
            clearTimeout(timeout)
            worker.removeEventListener('message', initListener)
            resolve()
          } else if (e.data.type === 'ERROR') {
            clearTimeout(timeout)
            worker.removeEventListener('message', initListener)
            reject(new Error(e.data.error))
          }
        }
        worker.addEventListener('message', initListener)
      })

      // Setup main listener for predictions
      worker.addEventListener('message', (e: MessageEvent) => {
        if (e.data.type === 'RESULT') {
          console.log('[NERTier] Received inference result for ID:', e.data.id)
          const req = this.pendingRequests.get(e.data.id)
          if (req) {
            this.pendingRequests.delete(e.data.id)
            if (e.data.error) {
              req.reject(new Error(e.data.error))
            } else {
              req.resolve(e.data.predictions)
            }
          }
        }
      })

      console.info('[NERTier] Worker fully ready')
      return worker
    } catch (err) {
      console.warn('[NERTier] Worker initialization failed:', (err as Error).message)
      return null
    }
  }

  async run(text: string, config: PIIConfig): Promise<PIIEntity[]> {
    console.log('[NERTier] Run requested for text length:', text.length)
    const worker = await this.getWorker()
    if (!worker || !this.tokenizer) {
      console.warn('[NERTier] Skip: Worker or tokenizer not available')
      return []
    }

    try {
      console.log('[NERTier] Tokenizing...')
      const { inputIds, attentionMask, tokenTypeIds, tokens } = this.tokenizer.tokenize(text, this.maxSeqLen)
      
      const id = ++this.reqId
      console.log('[NERTier] Posting INFER message, ID:', id)
      const predictions = await new Promise<number[] | null>((resolve, reject) => {
        this.pendingRequests.set(id, { resolve, reject })
        worker.postMessage({
          type: 'INFER',
          id,
          inputIds,
          attentionMask,
          tokenTypeIds,
          maxSeqLen: this.maxSeqLen
        })
      })

      if (!predictions) {
        console.warn('[NERTier] No predictions received')
        return []
      }

      console.log('[NERTier] Processing predictions...')
      const spans = this.spansFromLabels(tokens, predictions, text)
      console.log(`[NERTier] Found ${spans.length} spans`)
      const entities: PIIEntity[] = []

      for (const span of spans) {
        let severity: any = 'low'
        if (HIGH_PRIORITY_LABELS.has(span.type)) severity = 'critical'
        else if (MEDIUM_PRIORITY_LABELS.has(span.type)) severity = 'high'

        const category = this.mapLabelToCategory(span.type)
        if (!config.categories[category]?.enabled) continue

        entities.push({
          id: crypto.randomUUID(),
          type: span.type,
          label: this.formatLabel(span.type),
          category,
          value: span.value,
          maskedValue: '[REDACTED]',
          confidence: 0.85, // Fallback confidence
          tier: 'ner',
          startIndex: span.start,
          endIndex: span.end,
          severity,
        })
      }

      return entities

    } catch (err) {
      console.error('[NERTier] Run failed:', (err as Error).message)
      return []
    }
  }

  private spansFromLabels(
    tokens: string[],
    predictions: number[],
    originalText: string
  ): Array<{ type: string; value: string; start: number; end: number }> {
    const spans: Array<{ type: string; value: string; start: number; end: number }> = []
    let currentType: string | null = null
    let currentTokens: string[] = []
    let searchCursor = 0

    const flush = () => {
      if (currentType && currentType !== 'O' && currentTokens.length > 0) {
        const value = currentTokens
          .join('')
          .replace(/##/g, '')
          .replace(/\s+/g, ' ')
          .trim()

        if (value.length > 1) {
          const searchIn = originalText.toLowerCase()
          const needle = value.toLowerCase()
          let idx = searchIn.indexOf(needle, searchCursor)

          if (idx >= 0) {
            // Full Word Expansion Logic
            const matchEnd = idx + value.length
            while (idx > 0 && /\w/.test(originalText[idx - 1]!)) idx--
            let end = matchEnd
            while (end < originalText.length && /\w/.test(originalText[end]!)) end++

            spans.push({
              type: currentType,
              value: originalText.slice(idx, end),
              start: idx,
              end: end,
            })
            searchCursor = end
          }
        }
      }
      currentType = null
      currentTokens = []
    }

    for (let i = 0; i < tokens.length; i++) {
      const label = LABEL_MAP[predictions[i]!] ?? 'O'
      const token = tokens[i]!

      if (label === 'O' || token === '[PAD]' || token === '[CLS]' || token === '[SEP]') {
        flush()
      } else {
        if (currentType && currentType !== label) flush()
        currentType = label
        const sep = token.startsWith('##') ? '' : ' '
        currentTokens.push(sep + token)
      }
    }
    flush()
    return spans
  }

  private mapLabelToCategory(label: string): PIICategory {
    const fin = ['B-IDCARD', 'I-IDCARD', 'B-PASSPORT', 'I-PASSPORT', 'B-SOCIALNUMBER', 'I-SOCIALNUMBER', 'B-DRIVERLICENSE', 'I-DRIVERLICENSE']
    if (fin.includes(label)) return 'FINANCIAL'
    const confidential = ['B-PASS', 'I-PASS', 'B-SECADDRESS', 'I-SECADDRESS']
    if (confidential.includes(label)) return 'CONFIDENTIAL'
    return 'PII'
  }

  private formatLabel(type: string): string {
    return type
      .replace(/^[BI]-/, '')
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }
}
