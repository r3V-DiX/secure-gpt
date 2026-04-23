# SecureGPT Copilot Instructions

## Build, test, and lint commands

### Monorepo (root)
- Install deps: `npm install`
- Lint all workspaces: `npm run lint`
- Type-check all workspaces: `npm run typecheck`
- Run all workspace tests: `npm run test:all`

### Extension (`@securegpt/extension`)
- Dev build (watch): `npm run dev:extension`
- Production build: `npm run build:extension`
- Tests: `npm run test:extension`
- Single test file: `npm run test --workspace=@securegpt/extension -- tests/content/interceptor.test.ts`

### Detection engine (`@securegpt/detection`)
- Tests: `npm run test:detection`
- Single test file: `npm run test --workspace=@securegpt/detection -- tests/pipeline.test.ts`
- Coverage: `npm run test --workspace=@securegpt/detection -- --coverage`

### Dashboard (`secure-gpt-dashboard`)
- Dev server: `npm run dev:dashboard`
- Production build: `npm run build:dashboard`
- Lint: `npm run lint --workspace=secure-gpt-dashboard`

### Backend (FastAPI)
- Install deps: `cd backend && pip install -r requirements.txt`
- Apply migrations: `cd backend && alembic upgrade head`
- Run API: `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## High-level architecture

SecureGPT is a monorepo with one core runtime path: **browser extension intercepts prompts/files, runs local detection/redaction, then sends only metadata to backend**.

1. **Extension runtime split**
   - `packages/extension/src/content/*`: content script intercepts submit/paste/drop events and gates send behavior.
   - `packages/extension/src/background/*`: service worker handles policy sync, batched log upload, and OCR/PDF orchestration.
   - `packages/extension/src/offscreen/offscreen.ts`: offscreen document runs OCR/PDF extraction and text detection calls that require worker/DOM-compatible context.

2. **Detection pipeline**
   - `packages/detection/src/pipeline.ts` is the main entrypoint exported to consumers.
   - Execution order is Regex → masked text for NER → merge; OCR is handled separately for image/PDF paths.
   - Shared detection/policy types come from `@securegpt/shared`.

3. **Backend API + auth**
   - FastAPI app in `backend/app/main.py`, routes in `backend/app/api/v1/*`.
   - Extension-specific endpoints: `/api/v1/extension/policy` and `/api/v1/extension/log`.
   - Auth is **server-side session cookie + fingerprint validation** (not JWT).

4. **Dashboard integration**
   - Next.js app in `packages/secure-gpt-dashboard`.
   - Dashboard uses same-origin `/api/v1/*` calls and a Next rewrite proxy to backend to keep session cookies reliable.

## Key conventions (repo-specific)

- **Privacy invariant:** do not send raw matched sensitive values to backend logs. Extension logs send hashes/metadata (`snippetHash`, categories, actions, tier).
- **Action precedence is strict:** `BLOCK > MASK > WARN_ALLOW > ALLOW` (used when multiple entities/categories are detected).
- **Use shared contracts:** API/detection/policy shapes must stay aligned with `packages/shared/src/types/*` and constants in `packages/shared/src/constants/*`.
- **Backend response envelope is standardized:** routes should return `success(...)`, `paginated(...)`, or `error(...)` from `backend/app/core/response.py`.
- **Policy sync/log batching behavior is intentional:** extension polls policy periodically and flushes log batches on interval/size threshold; preserve this behavior when modifying background flow.
- **Dashboard Next.js caveat (from AGENTS.md):** this project treats Next.js behavior as potentially breaking across versions; check local Next docs under `node_modules/next/dist/docs/` before framework-level changes.
- **Detection package boundary:** extension should consume detection through `@securegpt/detection` pipeline exports; avoid bypassing package boundaries with ad-hoc imports.
