// ─────────────────────────────────────────────
// Tier 2 — NER (Named Entity Recognition)
// Irreversible detection via ONNX Runtime Web
// ─────────────────────────────────────────────

// ONNX load moved to worker
import { BaseTier } from '../base-tier'
import { WordPieceTokenizer } from './wordpieceTok'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'
// @ts-ignore - handled by vite?raw or custom loader
import vocabRaw from './vocab.txt?raw'

const LABEL_MAP: Record<number, string> = {
  0: 'ACCOUNTNAME', 1: 'ACCOUNTNUMBER', 2: 'AGE', 3: 'AMOUNT', 4: 'BIC',
  5: 'BITCOINADDRESS', 6: 'BUILDINGNUMBER', 7: 'CITY', 8: 'COMPANYNAME',
  9: 'COUNTY', 10: 'CREDITCARDCVV', 11: 'CREDITCARDISSUER', 12: 'CREDITCARDNUMBER',
  13: 'CURRENCY', 14: 'CURRENCYCODE', 15: 'CURRENCYNAME', 16: 'CURRENCYSYMBOL',
  17: 'DATE', 18: 'DOB', 19: 'EMAIL', 20: 'ETHEREUMADDRESS', 21: 'EYECOLOR',
  22: 'FIRSTNAME', 23: 'GENDER', 24: 'HEIGHT', 25: 'IBAN', 26: 'IP',
  27: 'IPV4', 28: 'IPV6', 29: 'JOBAREA', 30: 'JOBTITLE', 31: 'JOBTYPE',
  32: 'LASTNAME', 33: 'LITECOINADDRESS', 34: 'MAC', 35: 'MASKEDNUMBER',
  36: 'MIDDLENAME', 37: 'NEARBYGPSCOORDINATE', 38: 'O', 39: 'ORDINALDIRECTION',
  40: 'PASSWORD', 41: 'PHONEIMEI', 42: 'PHONENUMBER', 43: 'PIN', 44: 'PREFIX',
  45: 'SECONDARYADDRESS', 46: 'SEX', 47: 'SSN', 48: 'STATE', 49: 'STREET',
  50: 'TIME', 51: 'URL', 52: 'USERAGENT', 53: 'USERNAME', 54: 'VEHICLEVIN',
  55: 'VEHICLEVRM', 56: 'ZIPCODE',
}

const HIGH_PRIORITY_LABELS = new Set([
  'ACCOUNTNUMBER', 'BITCOINADDRESS', 'CREDITCARDNUMBER', 'CREDITCARDCVV',
  'EMAIL', 'ETHEREUMADDRESS', 'IBAN', 'IPV4', 'IPV6', 'PASSWORD',
  'PHONEIMEI', 'PHONENUMBER', 'PIN', 'SSN', 'VEHICLEVIN'
])

const MEDIUM_PRIORITY_LABELS = new Set([
  'ACCOUNTNAME', 'CITY', 'COMPANYNAME', 'DATE', 'DOB', 'FIRSTNAME',
  'LASTNAME', 'MIDDLENAME', 'STREET', 'ZIPCODE', 'JOBTITLE'
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
      this.tokenizer = new WordPieceTokenizer(vocabRaw)

      // Initialize worker
      const worker = new Worker(new URL('../../workers/ner.worker.ts', import.meta.url), { type: 'module' })
      
      // Wait for READY message
      await new Promise<void>((resolve, reject) => {
        const initListener = (e: MessageEvent) => {
          if (e.data.type === 'READY') {
            worker.removeEventListener('message', initListener)
            resolve()
          } else if (e.data.type === 'ERROR') {
            worker.removeEventListener('message', initListener)
            reject(new Error(e.data.error))
          }
        }
        worker.addEventListener('message', initListener)
      })

      // Setup main listener for predictions
      worker.addEventListener('message', (e: MessageEvent) => {
        if (e.data.type === 'RESULT') {
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

      console.info('[NERTier] Worker initialized')
      return worker
    } catch (err) {
      console.warn('[NERTier] Worker initialization failed:', (err as Error).message)
      return null
    }
  }

  async run(text: string, config: PIIConfig): Promise<PIIEntity[]> {
    const worker = await this.getWorker()
    if (!worker || !this.tokenizer) return []

    try {
      const { inputIds, attentionMask, tokenTypeIds, tokens } = this.tokenizer.tokenize(text, this.maxSeqLen)
      
      const id = ++this.reqId
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

      if (!predictions) return []

      const spans = this.spansFromLabels(tokens, predictions, text)
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
    const fin = ['ACCOUNTNUMBER', 'CREDITCARDNUMBER', 'IBAN', 'SSN', 'BITCOINADDRESS', 'ETHEREUMADDRESS', 'AMOUNT', 'CURRENCY']
    if (fin.includes(label)) return 'FINANCIAL'
    const confidential = ['PASSWORD', 'PIN', 'APIKEY', 'SECRETKEY']
    if (confidential.includes(label)) return 'CONFIDENTIAL'
    return 'PII'
  }
}
