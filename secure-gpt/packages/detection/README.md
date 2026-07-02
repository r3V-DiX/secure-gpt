# @securegpt/detection

Detection engine for SecureGPT. All PII detection runs locally in the browser.

## Architecture

```
pipeline.ts              ← ONLY import this from extension
  ├── tiers/regex/       ← Tier 1: Regex + validators (ACTIVE)
  ├── tiers/ner/         ← Tier 2: BERT NER (STUB — implement this)
  └── tiers/ocr/         ← Tier 3: Tesseract OCR (STUB — implement this)
```

## Usage (from extension)

```typescript
import { detectPII } from '@securegpt/detection'
import type { PIIConfig } from '@securegpt/shared'

const result = await detectPII(text, config)

if (result.hasFindings) {
  console.log(result.entities)   // PIIEntity[]
  console.log(result.tier)       // 'regex' | 'ner' | 'ocr'
}
```

## Team Split

| What | Who |
|------|-----|
| `pipeline.ts` | AI dev maintains |
| `tiers/regex/` | AI dev maintains |
| `tiers/ner/` | **AI dev — implement** |
| `tiers/ocr/` | **AI dev — implement** |
| `rules/` | AI dev adds/removes rules |
| `validators/` | AI dev adds validators |
| All tests | AI dev owns |

## Running Tests

```bash
npm test                 # run all tests
npm run test:watch       # watch mode
npm run test:coverage    # coverage report
```

## Adding a New Rule

1. Create a file in `src/rules/<category>/my-rule.rule.ts`
2. Export a `DetectionRule[]` array
3. Add to the barrel `src/rules/<category>/index.ts`
4. Done — pipeline picks it up automatically

## Adding a New Tier

1. Create `src/tiers/<name>/<name>Tier.ts`
2. Extend `BaseTier` and implement `run()`
3. Add to `src/tiers/index.ts` TIER_REGISTRY
4. Done — pipeline picks it up automatically

## Implementing NER Tier

See `src/tiers/ner/nerTier.ts` for TODO comments.
Model files go in `src/models/ner-v1/`.
Generate with: `python scripts/export_ner.py`

## Implementing OCR Tier

See `src/tiers/ocr/ocrTier.ts` for TODO comments.
Tesseract WASM assets go in `packages/extension/public/ocr/`.
