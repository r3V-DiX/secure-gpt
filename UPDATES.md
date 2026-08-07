# Updates

Summary of recent changes. Newest first.

## 2026-08-07 — Office-document PII scanning via `@firecrawl/anydoc-wasm`

**What.** SecureGPT now intercepts and scans office documents (`.docx/.xlsx/.pptx/.odt/.rtf/.epub/.csv` and legacy `doc/ppt/xls/...`) in the browser extension. Previously these file types passed through LLM uploads **unscanned** — a DLP gap.

**Why anydoc.** `firecrawl/anydoc` (https://github.com/firecrawl/anydoc, MIT) is a pure-Rust library that converts 14 office formats to clean Markdown. The `@firecrawl/anydoc-wasm` package (v0.1.7) runs fully client-side — no models, no external services, no runtime downloads — which matches the "detection stays on-device" requirement. 6.5 MB wasm, negligible against the existing 321 MB bundle.

**Flow.**

```
interceptor (isOfficeFile) → background DETECT_PII_OFFICE
  → offscreen OFFSCREEN_RUN_OFFICE → anydoc toMarkdownBytes → { ok, text }
  → background handleDetectPII(text, config)   // existing regex→NER→merge→allowlist
  → findings ? block + banner : forward original
```

**DLP action for office docs: block.** Office formats can't be pixel-masked (images) or coordinate-redacted (PDFs) cheaply, so a file with findings is **not dispatched** — a `block` banner is shown and a `BLOCK` audit event is logged (mirrors the text BLOCK path). Clean files forward as-is.

**Fail-open on scan failure.** `unsupported` / `encrypted` / `malformed` / `resourceLimit` extraction errors forward the original file rather than silently dropping a user's upload — consistent with the pre-existing behavior for non-intercepted types. A fail-closed toggle could be a follow-up.

**File detection.** Office MIME types are unreliable (docx often reports `application/octet-stream`), so detection uses a filename-extension whitelist plus known office MIME prefixes (`application/vnd.ms-*`, `application/vnd.openxmlformats-officedocument.*`). Content-based `formatFromBytes` double-checks in the offscreen.

**CSV support.** CSV has no content signature (`formatFromBytes` returns `undefined`), so the filename is threaded through the whole chain (`interceptor → background → offscreen`) and `formatFromExtension` names the format as a fallback. Without this, CSVs would have silently forwarded unscanned.

**Guardrails.** 20 MB scan cap — oversized files forward unscanned, bounding the synchronous offscreen conversion call.

### Files changed

| File | Change |
| --- | --- |
| `secure-gpt/packages/extension/package.json` | added `@firecrawl/anydoc-wasm@^0.1.7` |
| `secure-gpt/packages/extension/src/offscreen/offscreen.ts` | `OFFSCREEN_RUN_OFFICE` handler; lazy anydoc `init()` singleton; `formatFromBytes` + `formatFromExtension` fallback + `toMarkdownBytes(bytes, fmt)` |
| `secure-gpt/packages/extension/src/background/detection-handler.ts` | `handleDetectPIIOffice` (offscreen proxy → `handleDetectPII`), threads `fileName` |
| `secure-gpt/packages/extension/src/background/index.ts` | `DETECT_PII_OFFICE` message case, passes `fileName` |
| `secure-gpt/packages/extension/src/content/interceptor.ts` | `isOfficeFile` helper; office wiring in paste/file-change/drop/`handleFileScan`; block path; size cap; fail-open catch |
| `secure-gpt/packages/extension/tests/content/office-file.test.ts` | `isOfficeFile` unit tests |
| `secure-gpt/packages/extension/tests/offscreen/office-detect.test.ts` | anydoc → `detectPII` chain test (finds PAN + credit card) |
| `secure-gpt/packages/extension/tests/fixtures/pii.docx` | minimal docx fixture (PAN `ABCDE1234F`, test card `4111...`) |

### Verification

- `npm run build:extension` — wasm emitted to `dist/assets/anydoc_wasm_bg-*.wasm`; offscreen bundle fetches it from the chrome-extension origin (covered by existing CSP `'wasm-unsafe-eval'`).
- `npm run test:extension` — 7/7 pass.
- `eslint` — 0 errors (warnings are pre-existing `no-console`/`no-explicit-any` style).
- Typecheck — new code clean. **Note:** 8 pre-existing errors remain in untouched code (`handleGlobalInput` async return, `ShieldModal`/`modal-manager` `exactOptionalPropertyTypes`, `demo-detection.ts` missing `ruleId`, WIP `rotatedImageUrl` in `runImageOcr`). Out of scope; still open.

### Manual test documents — `test_documents/`

Dummy files for manual testing (upload to an LLM page with the extension loaded). All verified: block files detect PII and would be blocked; clean files forward; `.txt` is not intercepted.

| File | Expected |
| --- | --- |
| `block-pii.docx` | BLOCK — PAN `ABCDE1234F` + card `4111111111111111` |
| `block-aadhaar.docx` | BLOCK — Aadhaar `7592 2902 8107` + phone |
| `block-pii.xlsx` | BLOCK — PAN + card in a spreadsheet cell |
| `block-pii.pptx` | BLOCK — PAN on a slide |
| `block-pii.csv` | BLOCK — PAN in a CSV row (CSV has no content signature; exercises the `fileName` path) |
| `clean.docx` | FORWARD — benign text |
| `clean.xlsx` | FORWARD — benign table |
| `clean.csv` | FORWARD — benign CSV |
| `notes.txt` | not intercepted — negative control |

### Boundaries / non-goals

- anydoc has **no OCR**. Scanned/image-only PDFs throw `unsupported` and stay on the tesseract path; pdfjs-dist still handles text-PDF extraction/regions/masking. This change is additive.
- Office blocking is hard-block on any finding — per-category policy actions (WARN/ALLOW) are not consulted. Possible follow-up.
- No zip-level structural redaction of docx/xlsx (block-only). Possible follow-up.

---

## Pre-existing work in progress (not from this session)

Uncommitted changes present at session start in `secure-gpt/packages/detection/` and the manifest:

- **`src/tiers/ocr/ocrTier.ts`** — image preprocessing now returns `{ url, scale }`; `mapEntitiesToBboxes` gained `scale/rotation/imgWidth/imgHeight` params and reverse-rotates + reverse-scales bboxes back to original-image coordinates; rotation fallback records the applied angle.
- **`src/pipeline.ts`** — `detectPIIFromImage` destructures/passes the new OCR fields.
- **`src/rules/financial/index.ts`** — PAN regex loosened to accept OCR letter/digit misreads.
- **`src/validators/pan.validator.ts`** — `panCheck` fixes per-segment OCR misreads before exact-pattern validation.
- **`packages/extension/public/manifest.json`** — added `http://localhost:3000/*` and `http://localhost:8000/*` host permissions for local dashboard/backend.
