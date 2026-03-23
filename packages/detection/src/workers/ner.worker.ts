/// <reference lib="webworker" />
// ─────────────────────────────────────────────
// NER Worker
// Runs ONNX BERT inference in a Web Worker
// ─────────────────────────────────────────────

import * as ort from 'onnxruntime-web';

const LABEL_MAP: Record<number, string> = {
  0: 'ACCOUNTNAME', 1: 'ACCOUNTNUMBER', 2: 'AGE', 3: 'AMOUNT', 4: 'BIC',
  5: 'BITCOINADDRESS', 6: 'BUILDINGNUMBER', 7: 'CITY', 8: 'COMPANYNAME',
  9: 'COUNTY', 10: 'CREDITCARDCVV', 11: 'CREDITCARDISSUER', 12: 'CREDITCARDNUMBER',
  13: 'CURRENCY', 14: 'CURRENCYCODE', 15: 'CURRENCYNAME', 16: 'CURRENCYSYMBOL',
  17: 'DATE', 18: 'DOB', 19: 'EMAIL', 20: 'ETHEREUMADDRESS', 21: 'EYECOLOR',
  22: 'FIRSTNAME', 23: 'GENDER', 24: 'HEIGHT', 25: 'IBAN', 26: 'IP',
  27: 'IPV4', 28: 'IPV6', 29: 'JOBAREA', 30: 'JOBTITLE', 31: 'JOBTYPE',
  32: 'LASTNAME', 33: 'LITECOINADDRESS', 34: 'MAC', 35: 'MASKEDNUMBER',
  36: 'MIDDLENAME', 37: 'NEARBYGPSCOORDINATE', 38: 'O', 39: 'ORDINALDIRECTION',
  40: 'PASSWORD', 41: 'PHONEIMEI', 42: 'PHONENUMBER', 43: 'PIN', 44: 'PREFIX',
  45: 'SECONDARYADDRESS', 46: 'SEX', 47: 'SSN', 48: 'STATE', 49: 'STREET',
  50: 'TIME', 51: 'URL', 52: 'USERAGENT', 53: 'USERNAME', 54: 'VEHICLEVIN',
  55: 'VEHICLEVRM', 56: 'ZIPCODE',
};

let session: ort.InferenceSession | null = null;
let maxSeqLen = 128; // Can receive via init message

async function initSession() {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;

  let hasWebGPU = false;
  const nav = navigator as any;
  if (typeof nav?.gpu?.requestAdapter === 'function') {
    try {
      const adapter = await nav.gpu.requestAdapter();
      hasWebGPU = !!adapter;
    } catch {
      hasWebGPU = false;
    }
  }

  const modelUrl = '/models/pii-ner-int8.onnx';
  try {
      session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: hasWebGPU ? ['webgpu', 'wasm'] : ['wasm'],
        graphOptimizationLevel: 'all',
      });
      self.postMessage({ type: 'READY' });
  } catch (err) {
      self.postMessage({ type: 'ERROR', error: (err as Error).message });
  }
}

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

