# @securegpt/detection

Text detection orchestration for the extension. `detectPII(text, config)` runs `@securegpt/regex`, masks its matches before `@securegpt/ner`, merges results, and applies the policy allowlist. `detectPIIFromImage` runs the same text stages on OCR output. The package continues to export `RegexTier`, `NERTier`, and `OCRTier` for existing extension callers.

The independent engine packages own their rules, validators, tokenizer, and worker. Shared policy and entity types remain in `@securegpt/shared`; OCR remains in `@securegpt/ocr`. See [ADR 0004](../../../docs/adr/0004-text-detection-packages.md) and the [browser benchmark](../../../benchmarks/detection/README.md) for design and measured results.

From `secure-gpt/`, run `npm test --workspace=@securegpt/detection` and `npm run typecheck --workspace=@securegpt/detection`.
