// ─────────────────────────────────────────────
// Detection Types
// ─────────────────────────────────────────────

import type { PIICategory } from '../constants/pii-categories.constants'

export type DetectionTier = 'regex' | 'ner' | 'ocr'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface PIIEntity {
  id: string
  type: string                  // e.g. 'credit_card', 'email', 'pan_card'
  label: string                 // e.g. 'Credit / Debit Card Number'
  category: PIICategory         // FINANCIAL | PII | CONFIDENTIAL | IP
  value: string                 // the actual matched text
  maskedValue: string           // e.g. [EMAIL-REDACTED]
  startIndex: number            // char offset in original text
  endIndex: number              // char offset in original text
  confidence: number            // 0.0 - 1.0
  severity: Severity
  tier: DetectionTier           // which tier detected it
  bboxes?: Array<{ x0: number; y0: number; x1: number; y1: number }> // For OCR-based masking
}

export interface DetectionResult {
  hasFindings: boolean
  entities: PIIEntity[]
  tier: DetectionTier           // highest tier used
  processingTimeMs: number
  inputLength: number
}

export interface DetectionRequest {
  text: string
  config: import('./config.types').PIIConfig
}
