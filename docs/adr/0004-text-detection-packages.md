# ADR 0004: Independent regex and NER packages

## Status

Accepted, 2026-09-29.

## Context

The text detection pipeline mixed deterministic rules, model inference, and orchestration in `@securegpt/detection`. Unit tests mocked the NER worker, and the model-only evaluator did not measure the behavior shipped to Chrome. The OCR extraction established a useful precedent for isolating an engine and recording reproducible experiments.

## Decision

- Move rules and validators to `@securegpt/regex`; move tokenization, ONNX worker, and model-only scripts to `@securegpt/ner`.
- Keep `@securegpt/detection` as the regex-then-NER orchestrator and preserve `detectPII`, `RegexTier`, and `NERTier` exports for extension callers.
- Keep policy and entity contracts in `@securegpt/shared`. The extension continues to ship the ONNX and WASM runtime assets.
- Evaluate the browser worker and combined pipeline on versioned, span-labeled text. Use exact entity-span scoring and separate prompt, document, and provenance groups.

## Consequences

Each engine can be tested independently, and benchmark results now exercise the shipped model. The two new workspace packages add manifests and build aliases. The browser benchmark requires Chrome and does not replace a full MV3 extension interaction test.
