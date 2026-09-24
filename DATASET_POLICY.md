# SecureGPT Dataset Governance & Privacy Policy

## 1. Zero Real-Data Ingestion
- Real corporate or user secrets MUST NEVER be checked into the repository or published.
- All benchmark instances in `data/raw/` or `data/synthetic/` must use synthetic / anonymized data.

## 2. Immutability of Raw Data
- `data/raw/` is treated as write-once / read-only.
- All transformations, normalizations, and cleaning must output to `data/interim/` or `data/processed/`.

## 3. Versioning & Manifests
- Every dataset release must be documented in `data/manifests/` with SHA-256 integrity checksums and record counts.
