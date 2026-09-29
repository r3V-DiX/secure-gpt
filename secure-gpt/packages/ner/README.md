# @securegpt/ner

Browser ONNX worker, WordPiece tokenizer, and `NERTier.run(text, config)`. The worker loads `models/pii-ner-int8.onnx` and ONNX Runtime WASM from the extension origin; the extension continues to ship those assets. Token character offsets map model labels back to source text without a substring search.

Run `npm test --workspace=@securegpt/ner` and `npm run typecheck --workspace=@securegpt/ner` from `secure-gpt/`. `scripts/evaluate.py` is the older token-level model-only evaluator; the browser benchmark at `../../../benchmarks/detection/` measures the combined shipped pipeline and is the source for the current experiment.
