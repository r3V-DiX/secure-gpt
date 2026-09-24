# Contributing to SecureGPT

Thank you for contributing to SecureGPT!

## Quick Start
1. **Install Dependencies**: `cd secure-gpt && npm install`
2. **Typecheck**: `npm run typecheck`
3. **Run Tests**: `npm run test:all`
4. **Run OCR Benchmark**: `npm run evaluate --workspace=@securegpt/ocr`

## Code Guidelines
- TypeScript strict mode enforced across all packages.
- All new detection tiers and engine adapters must provide unit tests in `tests/`.
- Ensure docs in `docs/` and experiment logs in `research/` are updated when changing detection algorithms.
