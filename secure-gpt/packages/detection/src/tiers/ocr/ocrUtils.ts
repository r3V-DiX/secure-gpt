// ─────────────────────────────────────────────
// Backward Compatibility Shim -> @securegpt/ocr/postprocessor
// ─────────────────────────────────────────────

export {
  CONFIDENTIAL_SIGNALS,
  classifyDocumentFuzzy as classifyDocument,
  upgradeSeverity,
} from '@securegpt/ocr'
