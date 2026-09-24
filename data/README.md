# SecureGPT Data Lifecycle & Corpus Management

This directory manages the end-to-end lifecycle for training, validation, and benchmarking datasets used across SecureGPT's detection and OCR pipelines.

## 📁 Directory Structure

```
data/
├── schemas/           # JSON Schemas enforcing dataset item integrity
├── raw/               # Pristine source data (never edited manually)
├── interim/           # Intermediate transformed / cleaned data
├── processed/         # Production & benchmark-ready datasets
├── annotations/       # Human & verified machine annotations
│   ├── pii/           # Text entity span annotations
│   └── ocr/           # Image transcription & bounding box annotations
├── splits/            # Train / Validation / Test splits
│   ├── detection/
│   └── ocr/
├── synthetic/         # Procedurally generated test cases & fuzz payloads
└── manifests/         # Version manifests with SHA-256 checksums
```
