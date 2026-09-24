# SecureGPT

> Enterprise-grade, client-side Data Loss Prevention (DLP) browser extension and detection platform for Large Language Models (ChatGPT, Claude, Gemini).

---

## 📁 Repository Overview

```
secure-gpt-app/
├── docs/               # Engineering, architecture, security, and ADR documentation
├── data/               # Dataset lifecycle (schemas, raw, interim, processed, splits)
├── research/           # Experiment runs (EXP-001...), literature reviews, and findings
├── benchmarks/         # Automated evaluation runners (detection, ocr, end-to-end)
├── scripts/            # Deployment, data engineering, development, and research scripts
├── test_documents/     # Small curated fixtures (pdf, docx, xlsx, pptx, csv, images)
├── secure-gpt/         # Core codebase & monorepo packages
│   ├── backend/        # FastAPI backend
│   ├── packages/       # Monorepo packages (@securegpt/detection, @securegpt/ocr, @securegpt/extension...)
│   └── infra/          # Infrastructure configurations
├── RELEASE_TRACKER.md
├── DATASET_POLICY.md
├── RESEARCH.md
├── CONTRIBUTING.md
└── README.md
```

---

## 🚀 Quick Start

### Build & Run Development Extension
```bash
./scripts/development/start-dev.sh
```

### Run Tests & Benchmarks
```bash
# Run all workspace test suites
cd secure-gpt && npm run test:all

# Run OCR accuracy benchmark
npm run evaluate --workspace=@securegpt/ocr
```
