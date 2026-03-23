# SecureGPT Project Context

SecureGPT is an enterprise-grade Data Loss Prevention (DLP) solution designed to prevent sensitive data leaks into AI platforms (e.g., ChatGPT, Gemini, Claude). It operates through a browser extension that intercepts, detects, and masks PII/confidential data locally before it reaches the LLM provider.

## Architecture Overview

The project is structured as a monorepo with the following main components:

- **`backend/`**: A FastAPI-based Python backend.
  - Handles audit log ingestion, policy management, user/device authentication, and reporting.
  - Uses SQLAlchemy (PostgreSQL) for persistence and Alembic for migrations.
  - Includes a Celery/Redis worker for background tasks like alerts and report generation.
  - Implements a PDF redaction service for irreversible data removal.
- **`packages/detection/`**: The core detection engine (TypeScript).
  - Multi-tiered detection approach:
    - **Tier 1 (Regex)**: Fast pattern matching for structured data (Email, SSN, PAN, etc.).
    - **Tier 2 (NER)**: AI-based Named Entity Recognition using ONNX Runtime Web for browser-side inference.
    - **Tier 3 (OCR)**: Image-to-text extraction using Tesseract.js for processing screenshots/pastes.
- **`packages/extension/`**: The Chrome Extension (React + TypeScript).
  - Injected content scripts for intercepting LLM interactions.
  - Background service worker for state management and API communication.
  - Popups and settings pages for user interaction.
- **`packages/dashboard/`**: An administrative dashboard (Next.js).
  - Used by security admins and auditors to view logs, configure policies, and export reports.
- **`packages/shared/`**: Shared TypeScript types, constants, and utilities.
- **`infra/`**: Deployment configurations including Docker Compose and AWS (ECS/RDS) definitions.

## Project Type: Code Project

### Main Technologies
- **Backend**: Python (FastAPI, SQLAlchemy, Pydantic, Celery, Redis).
- **Detection**: TypeScript, ONNX Runtime Web, Tesseract.js.
- **Frontend (Extension/Dashboard)**: React, Next.js, TailwindCSS, TanStack Query.
- **Infrastructure**: Docker, AWS (ECS, RDS, ElastiCache).

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+
- Docker & Docker Compose

### Root Monorepo Commands
- `npm install`: Install dependencies for all workspaces.
- `npm run dev:extension`: Start extension development build.
- `npm run dev:dashboard`: Start dashboard development server.
- `npm run build:extension`: Build extension for production.
- `npm run build:dashboard`: Build dashboard for production.
- `npm run test:all`: Run tests across all workspaces.
- `npm run typecheck`: Run TypeScript type checks.
- `npm run lint`: Run ESLint.

### Backend Commands
- `cd backend`
- `pip install -r requirements.txt`
- `uvicorn app.main:app --reload`: Start development server.
- `alembic upgrade head`: Apply database migrations.
- `python scripts/export_ner.py`: Export and quantize the NER model for the extension.

## Development Conventions

- **Separation of Concerns**: Core detection logic resides in `packages/detection` and is agnostic of the extension/dashboard.
- **Privacy First**: Raw PII values are NEVER transmitted to the backend. The API only receives anonymized metadata and hashes.
- **Type Safety**: Strictly typed TypeScript and Pydantic models are used across the stack.
- **DLP Tiers**: Always consider the performance trade-offs between Regex, NER, and OCR tiers.
- **Commits**: Follow professional, concise commit message conventions.
