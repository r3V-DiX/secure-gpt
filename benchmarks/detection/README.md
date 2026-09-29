# Browser text-detection benchmark

This runner serves the extension's built model and WASM assets to headless Chrome. It calls the real `detectPII` entry point, including the ONNX NER worker. It refuses to save results unless the worker reports successful initialization. The runner does not mock inference.

## Run

From `secure-gpt/`, install workspace dependencies, then run:

```sh
npm run build:extension
npm run benchmark:build --workspace=@securegpt/extension
```

From the repository root, with Google Chrome and Python 3 installed:

```sh
python3 -m pip install -r benchmarks/detection/requirements.txt
python3 benchmarks/detection/evaluate.py --output /tmp/detection-results.json
python3 benchmarks/detection/evaluate.py --corpus benchmarks/detection/public_corpus.json --output /tmp/detection-public-results.json
```

The runner uses local ports 8765 and 9223. `corpus.json` contains synthetic cases and two existing repository fixtures. `public_corpus.json` contains short, sanitized excerpts derived from public sources, with source links and transformations recorded per case. Neither corpus contains raw customer submissions or secrets.

Gold annotations use exact character spans and the product's policy categories. Scores count exact span and category matches at entity level. `byTier.shareOfGoldDetected` attributes each correct detection to its emitting tier; it is not standalone tier recall. The browser worker runs with the same bundled model and WASM files as the extension, over a local HTTP origin rather than the `chrome-extension://` origin. The saved reports include model and corpus SHA-256 hashes.
