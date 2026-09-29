# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SecureGPT is a data-loss-prevention (DLP) product for LLM chat platforms. The browser extension intercepts prompts/files inside ChatGPT, Gemini, Copilot, Claude, Perplexity, and Meta AI pages, runs detection (regex + NER + OCR) **locally** in the browser, applies block/mask/warn actions, and sends only anonymized audit metadata to the backend. A Next.js dashboard manages policy, event logs, devices, and admin/RBAC features.

## Two parallel project trees — read this first

The repo contains **two near-duplicate, independently-installed project trees**:

- **`secure-gpt/`** — the full product: Chrome extension, detection engine, user dashboard, and backend.
- **`secure-gpt-admin/`** — an admin variant: admin dashboard (users/roles/permissions/audit/system-logs pages) + backend with RBAC. **No extension, no detection package.**

They share most code and are separate npm workspaces and separate Python backends (separate `node_modules`, `package-lock.json`, and `venv`). Changes to shared behavior (policy, auth, response envelope, event-log routing) frequently need to be made in **both** trees. Check the sibling tree when modifying either.

## Commands

### `secure-gpt/` (main workspace — npm workspaces: `extension`, `detection`, `shared`, `secure-gpt-dashboard`)

```bash
cd secure-gpt
npm install
npm run dev:extension        # vite watch build (popup/background/offscreen/content)
npm run build:extension      # node build.mjs → dist/; load dist/ as unpacked in chrome://extensions
npm run dev:dashboard        # Next.js dev server
npm run build:dashboard
npm run test:all             # vitest across all workspaces
npm run test:extension
npm run test:detection
npm run typecheck            # tsc --noEmit across workspaces
npm run lint                 # eslint from workspace root
```

Single test file:

```bash
npm run test --workspace=@securegpt/extension -- tests/content/interceptor.test.ts
npm run test --workspace=@securegpt/regex -- src/regexTier.test.ts
```

### `secure-gpt-admin/` (npm workspaces: `shared`, `secure-gpt-dashboard`)

```bash
cd secure-gpt-admin
npm install
npm run dev:dashboard
npm run build:dashboard
npm run test:all
npm run typecheck
npm run lint
```

### Backend (FastAPI — one in each tree, commands run from that tree's `backend/` dir)

```bash
cd backend
pip install -r requirements.txt        # venv exists at backend/venv
alembic upgrade head                    # apply migrations
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

RBAC / admin commands (from `backend/`, or via `docker exec secure-gpt-admin-backend ...` in prod):

```bash
python -m app.commands.seed_rbac        # seed roles/permissions (required before manage_super_admin works)
python -m app.commands.manage_super_admin add <email>   # or remove
```

Backend config (`app/core/config.py`) reads `.env` and **fails fast on startup** if required secrets (`secret_key`, `database_url`, `session_secret_key`, Google OAuth creds) are missing — never add defaults for those.

## Architecture

Core runtime path: **extension content script intercepts → background SW orchestrates → local detection (regex/NER/OCR) → action enforced → anonymized log batch to backend**.

### Extension (`secure-gpt/packages/extension`, Chrome MV3)

- `src/content/*` — `interceptor.ts` is the entry: captures Enter key, send-button click, form submit, paste, file drop. Combines detection entities with cached OCR entities, resolves the strict action precedence `BLOCK > MASK > WARN_ALLOW > ALLOW`, then blocks/replaces text/masks assets and (re)submits. Live typing detection lives in `live-warning-tooltip.ts`.
- `src/background/*` — service worker. `policy-sync.ts` connects to `/api/v1/extension/policy/stream` (SSE) with a `chrome.alarms` 60s poll fallback; `log-batcher.ts` buffers audit events in local storage and flushes on interval/batch-size threshold; `detection-handler.ts` routes detection messages to the offscreen document.
- `src/offscreen/offscreen.ts` — offscreen document runs OCR (`OFFSCREEN_RUN_OCR`), PDF extraction (`OFFSCREEN_RUN_PDF`, `OFFSCREEN_GET_PDF_REGIONS` via pdfjs-dist), and DETECT_PII pass-through — anything needing worker/DOM context.
- `src/lib/api/client.ts` — always sends `withCredentials: true` and `X-Extension-Request: true`. Base URLs default to `http://localhost:8000` (API) and `http://localhost:3000` (dashboard), overridable via `VITE_API_BASE_URL` / `VITE_DASHBOARD_URL`.
- Auth flow goes through the **dashboard origin** so the session cookie lands on the correct domain.

### Detection engine (`secure-gpt/packages/detection`)

- Entry: `src/pipeline.ts` — `detectPII(text, config)`. Order: Regex tier → mask regex spans → NER tier → merge (tier priority `regex < ner < ocr`; same-tier keeps higher confidence) → allowlist filter → `DetectionResult`.
- Image path: `detectPIIFromImage(imageData, config)` runs OCR first, then regex/NER on extracted text, maps entities to bounding boxes.
- NER runs in `packages/ner/src/workers/ner.worker.ts` via `onnxruntime-web` (WebGPU → WASM fallback), with its WordPiece tokenizer. OCR uses tesseract.js (`packages/detection/src/tiers/ocr/`), with a canvas preprocessor (2x upscale, grayscale, threshold binarization) for skewed/low-contrast images.
- Rules are grouped by category (`financial`, `pii`, `confidential`, `ip`) in `packages/regex/src/rules/*`, with optional context triggers and validators (luhn, verhoeff, pan, iban, phone, entropy, jwt).
- `packages/ner/scripts/evaluate.py` evaluates the ONNX model alone; `../benchmarks/detection/evaluate.py` benchmarks the browser pipeline and records entity-level precision and recall.

### Backend (FastAPI + SQLAlchemy async + PostgreSQL)

Layered: `app/api/v1/*` routes → `app/core/*` (dependencies, response, ratelimit, fingerprint, pagination, error_handlers) → `app/services/*` → `app/models/*`.

- Route groups: `auth`, `logs`, `alerts`, `policy`, `devices`, `redaction`, plus `extension/` (policy + log ingest).
- **Auth is server-side session cookie (`sgpt_session`) + fingerprint — not JWT.** Lazy fingerprint binding for OAuth-proxy sessions; requests with `X-Extension-Request: true` bypass fingerprint matching (cookie still validated).
- Response envelope is standardized: `success(data, message)`, `paginated(...)`, `error(code, message, details)` from `app/core/response.py`. Use these, don't hand-roll responses.
- Extension log ingest dedups by client-generated `event_id`. **Log payloads carry hashes/metadata (`snippetHash`, categories, actions, tier) — never raw matched sensitive values.**
- RBAC (both trees): dynamic tables `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `admin_audit_logs`. Guards `has_permission(action)` and `require_role_slug(*slugs)` live in `app/core/dependencies.py`. System roles (`is_system`) are protected.

### Dashboard (`secure-gpt/packages/secure-gpt-dashboard` and the admin twin)

- Next.js App Router. Global providers in `app/layout.tsx`: AuthProvider, ToastProvider, ThemeProvider, ModalProvider.
- Auth/proxy model: `src/proxy.ts` middleware guards routing; `next.config.ts` rewrites `/api/v1/*` → backend, so the browser is always same-origin with the dashboard and cookies survive. OAuth callback route (`app/api/auth/google/callback`) proxies the backend callback and plants the cookie on the dashboard origin.
- Feature modules under `src/features/*` (policy, event-log, alerts, dashboard, auth), each with services/`components`/hooks. Admin-only pages (`users`, `roles`, `permissions`, `audit`, `system-logs`) live directly in `src/app/(app)/*`.

### Shared (`@securegpt/shared`)

Single source of truth for categories/actions/platforms/masking constants (`src/constants/*`) and API/policy/detection/log/auth types (`src/types/*`). **Update this first when changing payload or policy contracts**, then propagate through extension/detection/dashboard/backend. The extension should consume detection only through `@securegpt/detection` pipeline exports — don't bypass package boundaries.

## Gotchas and intentional behavior

- **Next.js version is NOT stock Next.js** (16.2.1 with breaking changes). The dashboard `AGENTS.md`/`CLAUDE.md` instructs reading the bundled docs in `node_modules/next/dist/docs/` before any framework-level change. Heed deprecation notices.
- **Policy sync + log batching behavior is intentional** (SSE + 60s alarm fallback; interval/size-threshold flushes). Preserve it when touching background flow.
- `/logs` was renamed to `/event-logs` in both apps to bypass production routing blocks — keep that naming.
- `infra/` (docker-compose, aws) currently contains empty placeholders.
- The `Organisation` model is a schema scaffold; most active flows are user-scoped.
- Some backend service modules are placeholders while route handlers carry the active logic — check both before assuming a service is the source of truth.
- Root `scripts/` has deploy/package helpers; `manage_super_admin.sh` expects to run against the `secure-gpt-admin-backend` docker container.
- Local dev URL conventions: backend `:8000`, dashboards `:3000`, extension auth and API target these by default.
