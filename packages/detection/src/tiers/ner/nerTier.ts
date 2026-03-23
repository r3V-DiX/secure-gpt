// ─────────────────────────────────────────────
// Tier 2 — NER (Named Entity Recognition)
// Irreversible detection via ONNX Runtime Web
// ─────────────────────────────────────────────

import * as ort from 'onnxruntime-web'
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

export class NERTier extends BaseTier {
  readonly name = 'ner' as const
  readonly enabled = true

  private session: ort.InferenceSession | null = null
  private tokenizer: WordPieceTokenizer | null = null
  private readonly maxSeqLen = 128

  override async initialize(): Promise<void> {
    if (this.session) return

    try {
      this.tokenizer = new WordPieceTokenizer(vocabRaw)

      // Configure ONNX Runtime for WASM/WebGPU
      ort.env.wasm.numThreads = 1
      ort.env.wasm.simd = true

      const modelUrl = '/models/pii-ner-int8.onnx'
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm'], // WebGPU fallback to wasm is safer for broad compatibility
        graphOptimizationLevel: 'all',
      })

      console.info('[NERTier] ONNX Session ready')
    } catch (err) {
      console.warn('[NERTier] Initialization failed:', (err as Error).message)
      this.session = null
    }
  }

  async run(text: string, config: PIIConfig): Promise<PIIEntity[]> {
    if (!this.session || !this.tokenizer || !this.session.outputNames[0]) return []

    try {
      const { inputIds, attentionMask, tokenTypeIds, tokens } = this.tokenizer.tokenize(text, this.maxSeqLen)

      const feeds: Record<string, ort.Tensor> = {
        input_ids: new ort.Tensor('int64', inputIds, [1, this.maxSeqLen]),
        attention_mask: new ort.Tensor('int64', attentionMask, [1, this.maxSeqLen]),
      }
      
      // Some BERT models also require token_type_ids
      if (this.session.inputNames.includes('token_type_ids')) {
        feeds['token_type_ids'] = new ort.Tensor('int64', tokenTypeIds, [1, this.maxSeqLen])
      }

      const output = await this.session.run(feeds)
      const outputData = output[this.session.outputNames[0]]
      if (!outputData) return []
      
      const logits = outputData.data as Float32Array

      // Argmax over logits to get predictions
      const entities: PIIEntity[] = []
      const numLabels = Object.keys(LABEL_MAP).length

      for (let i = 0; i < this.maxSeqLen; i++) {
        const offset = i * numLabels
        let maxIdx = 0
        let maxVal = -Infinity
        for (let j = 0; j < numLabels; j++) {
          const val = logits[offset + j]
          if (val !== undefined && val > maxVal) {
            maxVal = val
            maxIdx = j
          }
        }

        const label = LABEL_MAP[maxIdx]
        if (label && label !== 'O') {
          // Found a potential PII entity
          const value = tokens[i]
          if (!value || value === '[PAD]' || value === '[CLS]' || value === '[SEP]') continue

          entities.push({
            id: crypto.randomUUID(),
            type: label,
            value: value,
            maskedValue: '[REDACTED]',
            confidence: this.sigmoid(maxVal),
            tier: 'ner',
            category: this.mapLabelToCategory(label),
            startIndex: 0, 
            endIndex: 0,
            severity: 'high'
          })
        }
      }

      return entities.filter(e => config.categories[e.category as PIICategory]?.enabled)

    } catch (err) {
      console.error('[NERTier] Run failed:', (err as Error).message)
      return []
    }
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x))
  }

  private mapLabelToCategory(label: string): PIICategory {
    const fin = ['ACCOUNTNUMBER', 'CREDITCARDNUMBER', 'IBAN', 'SSN']
    if (fin.includes(label)) return 'FINANCIAL'
    return 'PII'
  }
}
