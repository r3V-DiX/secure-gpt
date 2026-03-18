// ─────────────────────────────────────────────
// Tier 2 — NER (Named Entity Recognition)
// STUB — AI dev will implement this
// ─────────────────────────────────────────────

import { BaseTier } from '../base-tier'
import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'

export class NERTier extends BaseTier {
  readonly name = 'ner' as const
  readonly enabled = false // disabled until AI dev implements

  async initialize(): Promise<void> {
    // TODO (AI dev):
    // 1. Load ONNX BERT model from src/models/ner-v1/model.onnx
    // 2. Initialize ONNX Runtime Web session
    // 3. Load vocab.txt for wordpiece tokenizer
    // 4. Warm up model with a dummy input
    console.warn('[NERTier] Not yet implemented — skipping NER tier')
  }

  async run(_text: string, _config: PIIConfig): Promise<PIIEntity[]> {
    // TODO (AI dev):
    // 1. Tokenize text using wordpiece tokenizer
    // 2. Run ONNX inference via nerWorker.ts
    // 3. Decode token-level predictions back to character spans
    // 4. Map NER labels to PIIEntity format
    // 5. Filter based on config.categories
    // 6. Return array of PIIEntity
    return []
  }
}
