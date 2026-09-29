# SecureGPT Documentation Index

Welcome to the central product, architecture, and engineering documentation repository for SecureGPT.

## 📁 Directory Structure

```
docs/
├── architecture/       # System diagrams, component boundaries, and data flows
│   ├── overview.md     # High-level architecture & subsystem interactions
│   ├── data-flow.md    # Multi-tier detection & redaction event sequence
│   └── scalability-review.md # Scaling risks, priorities, and validation scenarios
├── development/        # Developer onboarding, setup, testing, and debugging
├── deployment/         # Local, enterprise, AWS, and production deployment guides
│   └── enterprise.md   # Enterprise DLP rollout and fleet management
├── security/           # Threat models, privacy boundaries, and security controls
├── detection/          # PII rule taxonomies, regex engines, and NER models
│   ├── taxonomy.md     # PII entity categories & prompt test corpus
│   └── regex-rules.md  # Regular expression definitions & checksum validators
├── ocr/                # Client-side OCR pipeline, image filters, and benchmarks
│   ├── pipeline.md     # 3-Stage OCR architecture & engine adapters
│   ├── preprocessing.md# Pure-TypedArray Otsu thresholding & dark mode filters
│   └── evaluation.md   # Accuracy evaluation harness, CER/WER/Recall metrics
└── adr/                # Architecture Decision Records (ADRs)
    ├── 0001-use-fastapi.md
    ├── 0002-detection-pipeline.md
    └── 0003-ocr-architecture.md
```

## Architecture reviews

- [Scalability review (2026-09-28)](architecture/scalability-review.md) — Eight prioritized findings, code references, recommended improvements, and load-testing scenarios.
