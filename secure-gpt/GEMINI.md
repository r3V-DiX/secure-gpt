# SecureGPT Project Context

SecureGPT: enterprise-grade DLP. Prevent data leaks into AI (ChatGPT, Gemini, Claude). Browser extension intercept, detect, mask PII/confidential data locally.

## Architecture Overview

Monorepo. Main components:

- **`backend/`**: FastAPI backend.
  - Audit log ingestion, policy management, auth, reporting.
  - SQLAlchemy (PostgreSQL), Alembic migrations.
  - Celery/Redis worker for alerts, reports.
  - PDF redaction service.
- **`packages/detection/`**: Detection engine (TypeScript).
  - Multi-tier detection:
    - **Tier 1 (Regex)**: Fast pattern match (Email, SSN, PAN, etc.).
    - **Tier 2 (NER)**: AI Named Entity Recognition, ONNX Runtime Web.
    - **Tier 3 (OCR)**: Image-to-text, Tesseract.js.
- **`packages/extension/`**: Chrome Extension (React + TypeScript).
  - Injected content scripts intercept LLM interaction.
  - Background worker manage state, API comms.
  - Popups, settings UI.
- **`packages/dashboard/`**: Admin dashboard (Next.js).
  - View logs, config policies, export reports.
- **`packages/shared/`**: Shared TS types, constants, utils.
- **`infra/`**: Docker Compose, AWS (ECS/RDS) configs.

## Project Type: Code Project

### Main Technologies
- **Backend**: Python (FastAPI, SQLAlchemy, Pydantic, Celery, Redis).
- **Detection**: TypeScript, ONNX Runtime Web, Tesseract.js.
- **Frontend**: React, Next.js, TailwindCSS, TanStack Query.
- **Infrastructure**: Docker, AWS (ECS, RDS, ElastiCache).

## Building and Running

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Docker & Docker Compose

### Root Monorepo Commands
- `npm install`: Install deps for all workspaces.
- `npm run dev:extension`: Dev build extension.
- `npm run dev:dashboard`: Start dashboard dev server.
- `npm run build:extension`: Prod build extension.
- `npm run build:dashboard`: Prod build dashboard.
- `npm run test:all`: Run all tests.
- `npm run typecheck`: TS type check.
- `npm run lint`: Run ESLint.

### Backend Commands
- `cd backend`
- `pip install -r requirements.txt`
- `uvicorn app.main:app --reload`: Start dev server.
- `alembic upgrade head`: Apply DB migrations.

### Model Preparation (NER)
- `python packages/detection/scripts/export_ner.py`: Export + quantize NER model.

## Development Conventions

- **Separation of Concerns**: Detection logic in `packages/detection` agnostic of extension/dashboard.
- **Privacy First**: Raw PII NEVER sent to backend. Only anonymized metadata/hashes.
- **Type Safety**: Strictly typed TS and Pydantic.
- **DLP Tiers**: Performance trade-offs: Regex vs NER vs OCR.
- **Commits**: Professional, concise conventions.
