/// <reference lib="webworker" />
// ─────────────────────────────────────────────
// NER Worker
// Runs ONNX BERT inference in a Web Worker
// ─────────────────────────────────────────────

import * as ort from 'onnxruntime-web/wasm';

const LABEL_MAP: Record<number, string> = {
  0: "B-BOD", 1: "B-BUILDING", 2: "B-CITY", 3: "B-COUNTRY", 4: "B-DATE",
  5: "B-DRIVERLICENSE", 6: "B-EMAIL", 7: "B-GEOCOORD", 8: "B-GIVENNAME1",
  9: "B-GIVENNAME2", 10: "B-IDCARD", 11: "B-IP", 12: "B-LASTNAME1",
  13: "B-LASTNAME2", 14: "B-LASTNAME3", 15: "B-PASS", 16: "B-PASSPORT",
  17: "B-POSTCODE", 18: "B-SECADDRESS", 19: "B-SEX", 20: "B-SOCIALNUMBER",
  21: "B-STATE", 22: "B-STREET", 23: "B-TEL", 24: "B-TIME", 25: "B-TITLE",
  26: "B-USERNAME", 27: "I-BOD", 28: "I-BUILDING", 29: "I-CITY", 30: "I-COUNTRY",
  31: "I-DATE", 32: "I-DRIVERLICENSE", 33: "I-EMAIL", 34: "I-GEOCOORD",
  35: "I-GIVENNAME1", 36: "I-GIVENNAME2", 37: "I-IDCARD", 38: "I-IP",
  39: "I-LASTNAME1", 40: "I-LASTNAME2", 41: "I-LASTNAME3", 42: "I-PASS",
  43: "I-PASSPORT", 44: "I-POSTCODE", 45: "I-SECADDRESS", 46: "I-SEX",
  47: "I-SOCIALNUMBER", 48: "I-STATE", 49: "I-STREET", 50: "I-TEL",
  51: "I-TIME", 52: "I-TITLE", 53: "I-USERNAME", 54: "O"
};

let session: ort.InferenceSession | null = null;
const maxSeqLen = 128; // Can receive via init message

// Global error handler
if (typeof self !== 'undefined') {
  self.addEventListener('error', (event: ErrorEvent) => {
    console.error('[NERWorker] Uncaught error:', event);
    self.postMessage({ type: 'ERROR', error: event.message || 'Unknown error' });
  });

  self.onunhandledrejection = (event) => {
    console.error('[NERWorker] Unhandled rejection:', event.reason);
    self.postMessage({ type: 'ERROR', error: event.reason?.message || 'Unhandled rejection' });
  };
}

async function initSession() {
  console.log('[NERWorker] Initializing session...');
  
  // Extension specific config
  // Note: ONNX Runtime Web 1.24+ requires explicit numThreads=1 for most extension contexts
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true; // Use SIMD if available
  
  // Ensure we are using the correct base path for the extension
  // chrome-extension://<id>/wasm/
  const base = self.location.origin;
  ort.env.wasm.wasmPaths = `${base}/wasm/`;
  
  console.log('[NERWorker] Configured WASM paths:', ort.env.wasm.wasmPaths);

  const modelUrl = `${base}/models/pii-ner-int8.onnx`;
  console.log('[NERWorker] Loading model from:', modelUrl);
  
  try {
      // Extension offscreen documents may expose navigator.gpu without an
      // adapter. Probing it emits a Chromium extension error even when WASM
      // succeeds, so use the bundled WASM provider directly.
      const providers = ['wasm'];
      console.log('[NERWorker] Attempting to create InferenceSession with providers:', providers);
      
      session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: providers,
        graphOptimizationLevel: 'all',
      });
      
      console.log('[NERWorker] Session created successfully.');
      self.postMessage({ type: 'READY' });
  } catch (err) {
      console.error('[NERWorker] Session creation failed:', (err as Error).message);
      
      self.postMessage({ type: 'ERROR', error: (err as Error).message });
  }
}

if (typeof self !== 'undefined') {
  initSession();

  self.addEventListener('message', async (e: MessageEvent) => {
    const data = e.data;
    if (data.type === 'INFER') {
      if (!session) {
        self.postMessage({ type: 'RESULT', id: data.id, predictions: null, error: 'Session not ready' });
        return;
      }
      try {
        const { id, inputIds, attentionMask, tokenTypeIds, maxSeqLen: reqMaxSeqLen } = data;
        const _maxSeqLen = reqMaxSeqLen || maxSeqLen;

        const feeds: Record<string, ort.Tensor> = {
          input_ids: new ort.Tensor('int64', BigInt64Array.from(inputIds.map((x: number) => BigInt(x))), [1, _maxSeqLen]),
          attention_mask: new ort.Tensor('int64', BigInt64Array.from(attentionMask.map((x: number) => BigInt(x))), [1, _maxSeqLen]),
        };

        if (session.inputNames.includes('token_type_ids') && tokenTypeIds) {
          feeds['token_type_ids'] = new ort.Tensor('int64', BigInt64Array.from(tokenTypeIds.map((x: number) => BigInt(x))), [1, _maxSeqLen]);
        }

        const output = await session.run(feeds);
        const logitsTensor = output[session.outputNames[0]!];
        if (!logitsTensor) {
          self.postMessage({ type: 'RESULT', id, predictions: [] });
          return;
        }

        const logits = logitsTensor.data as Float32Array;
        const numLabels = Object.keys(LABEL_MAP).length;

        const predictions: number[] = [];
        for (let i = 0; i < _maxSeqLen; i++) {
          let maxIdx = 0;
          let maxVal = -Infinity;
          for (let j = 0; j < numLabels; j++) {
            const val = logits[i * numLabels + j]!;
            if (val > maxVal) {
              maxVal = val;
              maxIdx = j;
            }
          }
          predictions.push(maxIdx);
        }

        self.postMessage({ type: 'RESULT', id, predictions });
      } catch (err) {
        self.postMessage({ type: 'RESULT', id: data.id, predictions: null, error: (err as Error).message });
      }
    }
  });
}
