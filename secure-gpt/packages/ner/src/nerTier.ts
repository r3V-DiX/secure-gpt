/// <reference types="vite/client" />
// ─────────────────────────────────────────────
// Tier 2 — NER (Named Entity Recognition)
// Irreversible detection via ONNX Runtime Web
// ─────────────────────────────────────────────

// ONNX load moved to worker
import { BaseTier } from '@securegpt/shared/tier'
import { WordPieceTokenizer } from './wordpieceTok'
import type { PIIConfig, PIIEntity } from '@securegpt/shared/types'
import {
  LABEL_MAP,
  HIGH_PRIORITY_LABELS,
  MEDIUM_PRIORITY_LABELS,
  spansFromLabels,
  mapLabelToCategory,
  formatLabel,
} from './nerSpans'

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
  private initializingWorker: Worker | null = null
  private rejectInitialization: ((error: Error) => void) | null = null
  private workerGeneration = 0
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
      const promise = this.loadWorker(this.workerGeneration).then((w) => {
        if (this.workerState.status !== 'loading' || this.workerState.promise !== promise) return w
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

  private async loadWorker(generation: number): Promise<Worker | null> {
    try {
      if (typeof Worker === 'undefined') {
        console.log('[NERTier] Worker not available in Node.js environment; skipping worker loading')
        return null
      }
      console.log('[NERTier] Starting worker initialization...')
      const [{ default: NERWorkerUrl }, { default: vocabRaw }] = await Promise.all([
        import('./workers/ner.worker?worker&url'),
        import('./vocab.txt?raw'),
      ])
      if (generation !== this.workerGeneration) return null
      this.tokenizer = new WordPieceTokenizer(vocabRaw)
      console.log('[NERTier] Tokenizer ready')

      // Initialize worker
      console.log('[NERTier] Worker URL:', NERWorkerUrl)
      const worker = new Worker(NERWorkerUrl, { type: 'module' })
      this.initializingWorker = worker
      
      // Wait for READY message
      await new Promise<void>((resolve, reject) => {
        this.rejectInitialization = reject
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
        worker.addEventListener('error', () => this.resetWorker(), { once: true })
      })
      this.initializingWorker = null
      this.rejectInitialization = null

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
      this.initializingWorker?.terminate()
      this.initializingWorker = null
      this.rejectInitialization = null
      console.warn('[NERTier] Worker initialization failed:', (err as Error).message)
      return null
    }
  }

  private resetWorker(): void {
    this.workerGeneration++
    this.initializingWorker?.terminate()
    if (this.workerState.status === 'ready') this.workerState.worker.terminate()
    this.rejectInitialization?.(new Error('NER_UNAVAILABLE'))
    for (const request of this.pendingRequests.values()) request.reject(new Error('NER_UNAVAILABLE'))
    this.pendingRequests.clear()
    this.workerState = { status: 'unloaded' }
  }

  private async documentWorker(signal?: AbortSignal): Promise<Worker | null> {
    if (this.workerState.status === 'unavailable') this.workerState = { status: 'unloaded' }
    let abort: (() => void) | undefined
    try {
      const stopped = new Promise<never>((_, reject) => {
        abort = () => { this.resetWorker(); reject(new Error('NER_CANCELLED')) }
        signal?.addEventListener('abort', abort, { once: true })
      })
      signal?.throwIfAborted()
      return await Promise.race([this.getWorker(), stopped])
    } finally { if (abort) signal?.removeEventListener('abort', abort) }
  }

  async run(text: string, config: PIIConfig, strict = false, signal?: AbortSignal): Promise<PIIEntity[]> {
    signal?.throwIfAborted()
    console.log('[NERTier] Run requested for text length:', text.length)
    const worker = await (strict ? this.documentWorker(signal) : this.getWorker())
    if (!worker || !this.tokenizer) {
      if (strict) throw new Error('NER_UNAVAILABLE')
      console.warn('[NERTier] Skip: Worker or tokenizer not available')
      return []
    }

    // The model accepts 128 tokens. Strict document scans must cover the rest
    // of the document too, with overlap to preserve entities across windows.
    const firstWindow = this.tokenizer.tokenize(text, this.maxSeqLen)
    const covered = Math.max(...firstWindow.offsets.map(offset => offset[1]))
    if (strict && covered > 0 && text.slice(covered).trim()) {
      const entities: PIIEntity[] = []
      let start = 0
      while (start < text.length) {
        signal?.throwIfAborted()
        const window = this.tokenizer.tokenize(text.slice(start), this.maxSeqLen)
        const ends = window.offsets.filter(offset => offset[1] > 0)
        const end = ends.at(-1)?.[1] ?? 0
        if (!end) break
        const found = await this.run(text.slice(start, start + end), config, true, signal)
        entities.push(...found.map(entity => ({ ...entity, startIndex: entity.startIndex + start, endIndex: entity.endIndex + start })))
        if (start + end >= text.trimEnd().length) break
        const overlap = ends[Math.max(0, ends.length - 24)]?.[0] ?? end
        start += Math.max(1, overlap)
      }
      return [...new Map(entities.map(entity => [`${entity.startIndex}:${entity.endIndex}:${entity.type}`, entity])).values()]
    }

    try {
      console.log('[NERTier] Tokenizing...')
      const { inputIds, attentionMask, tokenTypeIds, tokens, offsets } = this.tokenizer.tokenize(text, this.maxSeqLen)
      
      const id = ++this.reqId
      console.log('[NERTier] Posting INFER message, ID:', id)
      const predictions = await new Promise<number[] | null>((resolve, reject) => {
        const abort = () => {
          this.pendingRequests.delete(id)
          this.resetWorker()
          reject(new Error('NER_CANCELLED'))
        }
        signal?.addEventListener('abort', abort, { once: true })
        this.pendingRequests.set(id, {
          resolve: value => { signal?.removeEventListener('abort', abort); resolve(value) },
          reject: error => { signal?.removeEventListener('abort', abort); reject(error) },
        })
        if (signal?.aborted) { abort(); return }
        worker.postMessage({
          type: 'INFER',
          id,
          inputIds,
          attentionMask,
          tokenTypeIds,
          maxSeqLen: this.maxSeqLen
        })
      })

      if (!predictions || (strict && (predictions.length !== tokens.length || predictions.some(label => LABEL_MAP[label] === undefined)))) {
        if (strict) throw new Error('NER_INCOMPLETE')
        console.warn('[NERTier] No predictions received')
        return []
      }

      console.log('[NERTier] Processing predictions...')
      const spans = spansFromLabels(tokens, offsets, predictions, text)
      console.log(`[NERTier] Found ${spans.length} spans`)
      const entities: PIIEntity[] = []

      for (const span of spans) {
        let severity: any = 'low'
        if (HIGH_PRIORITY_LABELS.has(span.type)) severity = 'critical'
        else if (MEDIUM_PRIORITY_LABELS.has(span.type)) severity = 'high'

        const category = mapLabelToCategory(span.type)
        if (!config.categories[category]?.enabled) continue

        entities.push({
          id: crypto.randomUUID(),
          ruleId: `ner.${span.type.toLowerCase()}`,
          type: span.type,
          label: formatLabel(span.type),
          category,
          value: span.value,
          maskedValue: '[REDACTED]',
          confidence: 0.85,
          tier: 'ner',
          startIndex: span.start,
          endIndex: span.end,
          severity,
        })
      }

      return entities

    } catch (err) {
      if (strict) throw new Error('NER_INFERENCE_FAILED')
      console.error('[NERTier] Run failed:', (err as Error).message)
      return []
    }
  }
}
