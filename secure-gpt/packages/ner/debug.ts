import * as ort from 'onnxruntime-node';
import { WordPieceTokenizer } from './src/wordpieceTok';
import fs from 'fs';
import path from 'path';

// Paths
const MODEL_PATH = path.join(__dirname, '../extension/public/models/pii-ner-int8.onnx');
const VOCAB_PATH = path.join(__dirname, './src/vocab.txt');

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

async function main() {
  console.log('Testing NER model...');
  
  if (!fs.existsSync(MODEL_PATH)) {
    console.error(`Model not found at ${MODEL_PATH}. Run export script first.`);
    return;
  }

  const vocab = fs.readFileSync(VOCAB_PATH, 'utf-8');
  const tokenizer = new WordPieceTokenizer(vocab);
  
  const session = await ort.InferenceSession.create(MODEL_PATH);
  
  const testTexts = [
    "My email is john.doe@example.com and I live in New York.",
    "My phone number is 9876543210.",
    "Contact John Smith at the hospital.",
    "The patient was admitted on 2023-10-05.",
    "Passport number: Z1234567, SSN: 123-45-6789",
    "Call me at +91 98765 43210",
    "John Doe works at Google."
  ];

  for (const text of testTexts) {
    console.log(`\nInput: "${text}"`);
    const { inputIds, attentionMask, tokenTypeIds, tokens } = tokenizer.tokenize(text, 128);

    const feeds: any = {
      input_ids: new ort.Tensor('int64', inputIds, [1, 128]),
      attention_mask: new ort.Tensor('int64', attentionMask, [1, 128]),
    };

    if (session.inputNames.includes('token_type_ids')) {
      feeds.token_type_ids = new ort.Tensor('int64', tokenTypeIds, [1, 128]);
    }

    const output = await session.run(feeds);
    const outputName = session.outputNames[0];
    if (!outputName) throw new Error('No output name');
    const logits = output[outputName]!.data as Float32Array;
    const numLabels = Object.keys(LABEL_MAP).length;

    const predictions: number[] = [];
    for (let i = 0; i < 128; i++) {
      const tokenPredictions: { idx: number; val: number }[] = [];
      for (let j = 0; j < numLabels; j++) {
        const val = logits[i * numLabels + j];
        if (val !== undefined) {
          tokenPredictions.push({ idx: j, val });
        }
      }
      tokenPredictions.sort((a, b) => b.val - a.val);
      
      const best = tokenPredictions[0];
      if (!best) {
        predictions.push(54); // Default to 'O'
        continue;
      }
      predictions.push(best.idx);

      if (tokens[i] !== '[PAD]' && tokens[i] !== '[CLS]' && tokens[i] !== '[SEP]') {
        if (best.idx !== 54) { // 54 is 'O'
           console.log(`  Token "${tokens[i]}": ${LABEL_MAP[best.idx]} (${best.val.toFixed(2)})`);
        }
      }
    }

    // Print detected entities
    let currentEntity: string | null = null;
    let currentText = '';
    
    for (let i = 0; i < tokens.length; i++) {
      const predIdx = predictions[i];
      if (predIdx === undefined) continue;
      const label = LABEL_MAP[predIdx];
      const token = tokens[i];
      if (!token || !label) continue;
      
      if (token === '[PAD]') break;
      if (token === '[CLS]' || token === '[SEP]') continue;

      if (label !== 'O') {
        const cleanLabel = label.replace(/^[BI]-/, '');
        if (label.startsWith('B-')) {
          if (currentEntity) console.log(`  - ${currentEntity}: ${currentText}`);
          currentEntity = cleanLabel;
          currentText = token.replace('##', '');
        } else if (label.startsWith('I-') && currentEntity === cleanLabel) {
          currentText += (token.startsWith('##') ? '' : ' ') + token.replace('##', '');
        } else {
           if (currentEntity) console.log(`  - ${currentEntity}: ${currentText}`);
           currentEntity = null;
           currentText = '';
        }
      } else {
        if (currentEntity) console.log(`  - ${currentEntity}: ${currentText}`);
        currentEntity = null;
        currentText = '';
      }
    }
    if (currentEntity) console.log(`  - ${currentEntity}: ${currentText}`);
  }
}

main().catch(console.error);
