// ─────────────────────────────────────────────
// NER Worker
// STUB — AI dev will implement this
// Runs ONNX BERT inference in a Web Worker
// ─────────────────────────────────────────────

// TODO (AI dev):
// This worker receives tokenized input from nerTier.ts
// runs ONNX Runtime Web inference
// and returns token-level NER label predictions
//
// Message in:  { type: 'INFER', inputIds: number[], attentionMask: number[] }
// Message out: { type: 'RESULT', labels: string[], scores: number[] }

export {}
