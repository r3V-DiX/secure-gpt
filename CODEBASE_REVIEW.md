# SecureGPT Comprehensive Codebase Audit & Architectural Review

**Date:** September 2026  
**Status:** In Progress (Core Architecture Consolidated & UI Synchronized)  
**Scope:** Web Dashboard, Super Admin Portal, Chrome Extension, Detection Pipeline, Shared Packages, Backend API & Multi-Domain Deployment

---

# PART 1 — REPOSITORY STRUCTURE & ARCHITECTURE MAP

## 1. High-Level Architectural Flow

```
                     ┌─────────────────────────────────────────────────────────┐
                     │          TENANT USERS / ORG ADMIN / SUPER ADMIN         │
                     └────────────┬───────────────────────────────┬────────────┘
                                  │ (HTTPS)                       │ (HTTPS)
                                  ▼                               ▼
                     ┌─────────────────────────┐     ┌─────────────────────────┐
                     │  securegpt.rkavach.com  │     │admin.securegpt.rkavach  │
                     │  Standard Dashboard     │     │Super Admin Portal       │
                     │  (Next.js Port 3000)    │     │(Next.js Port 3001)      │
                     └────────────┬────────────┘     └────────────┬────────────┘
                                  │                               │
                                  ▼                               ▼
                     ┌─────────────────────────┐     ┌─────────────────────────┐
                     │ FastAPI Backend (8000)  │     │ Admin Backend (8001)    │
                     └────────────┬────────────┘     └────────────┬────────────┘
                                  │                               │
                                  ▼                               ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │         PostgreSQL Database & Redis Cache Cluster       │
                     └─────────────────────────────────────────────────────────┘
                                  ▲
                                  │ (Telemetry Sync & Policy Pull)
                     ┌────────────┴────────────────────────────┐
                     │         Chrome Extension (MV3)          │
                     │  (packages/extension - Regex/NER/OCR)   │
                     └────────────┬────────────────────────────┘
                                  │ (DOM Interception & Input Hooks)
                                  ▼
                     ┌─────────────────────────────────────────┐
                     │ 20+ Third-Party AI Platforms            │
                     │ (ChatGPT, Claude, Gemini, Copilot, etc.)│
                     └─────────────────────────────────────────┘
```

## 2. Layer-by-Layer Code Mapping

### A. Web Dashboard & Admin Portal (`secure-gpt/packages/secure-gpt-dashboard`)
* **Framework:** Next.js 16 (Turbopack) with React 19 and Tailwind CSS v4.
* **Unified Build Targets:**
  * **Standard Tenant App (`NEXT_PUBLIC_APP_MODE=standard`):** Bound to `securegpt.rkavach.com` (Port 3000). Serves personal users, employees, and organization admins with role-scoped telemetry.
  * **Super Admin Portal (`NEXT_PUBLIC_APP_MODE=admin`):** Bound to `admin.securegpt.rkavach.com` (Port 3001). Dedicated portal for global RBAC, cross-tenant organization analytics, system audit trails, and role management.
* **Key Routes (`src/app/(app)/`):**
  * `/dashboard` — Executive overview (Cross-tenant Top Orgs for Super Admin; Top Users & Departments for Org Admin).
  * `/policy` — Organization DLP policy management, sensitivity sliders, rule overrides.
  * `/event-logs` — Audit log table with filter bar and log detail modal.
  * `/users` — Global User Directory and Dynamic Role Assignment (Admin mode).
  * `/roles` & `/permissions` — System-wide RBAC matrix and granular permission management (Admin mode).
  * `/audit` & `/system-logs` — System authentication logs and database audit trails with CSV export (Admin mode).
  * `/team` — Organization member invitations and department grouping (Standard mode).
  * `/incidents` — Real-time security incident escalation stream.
  * `/profile` — User profile, API keys, and registered endpoint devices.

### B. Chrome Extension (`secure-gpt/packages/extension`)
* **Manifest:** Manifest V3 (`public/manifest.json`).
* **Service Worker (`src/background/index.ts`):** Handles extension lifecycle, alarm-based policy sync (`policy-sync.ts`), and log batching (`log-batcher.ts`).
* **Content Scripts (`src/content/`):**
  * `interceptor.ts` — Attaches input/keydown listeners to textareas and contenteditable targets; handles file drag-and-drop.
  * `radial-risk-gauge.ts` — Renders live HTML5 Canvas risk gauge indicator next to AI input boxes.
  * `site-detection-indicator.ts` — Floating badge indicator displaying site trust state.
  * `modal-manager.tsx` — React-based shadow-DOM injection for warning/blocking modals.
  * `dom-utils.ts` — Multi-platform selector engine targeting 20+ AI interfaces.
* **Offscreen Document (`src/offscreen/`):** WASM Tesseract OCR engine and Transformers.js client-side NER model runner.

### C. Detection Engine (`secure-gpt/packages/detection`)
* **Tier 1 (Regex & Rules):** `src/tiers/regex/` — Precompiled patterns for PII, financial info, secrets, credentials, API keys.
* **Tier 2 (Keyword & Exact):** `src/tiers/keyword/` — High-speed exact dictionary lookup and Aho-Corasick matching.
* **Tier 3 (NER Machine Learning):** `src/tiers/ner/` — Transformers.js token classification for contextual entities.
* **Tier 4 (OCR / Document Parser):** `src/tiers/ocr/` — Tesseract.js WASM for images + custom parsers for PDF, DOCX, XLSX, CSV.

### D. Shared Workspace (`secure-gpt/packages/shared`)
* **Types & Enums:** `api.types.ts`, `auth.types.ts`, `config.types.ts`, `detection.types.ts`, `log.types.ts`, `policy.types.ts`.
* **Constants:** `builtin-rules.constants.ts`, `policy-actions.constants.ts`, `pii-categories.constants.ts`, `platforms.constants.ts`, `masking-tokens.constants.ts`.

### E. Backend API & Services (`secure-gpt/backend`)
* **Framework:** FastAPI, Python 3.12, SQLAlchemy 2.0 Async/Sync, Alembic migrations.
* **API Endpoints (`app/api/v1/`):**
  * `auth/` — Session handling, Google OAuth, Microsoft OAuth, email OTP.
  * `admin/` — Users, roles, permissions, audit trails.
  * `orgs.py` — Organization hierarchy, multi-tenancy settings.
  * `policy.py` — CRUD operations for organization and custom policy rules.
  * `logs.py` — Querying, filtering, and exporting telemetry audit logs.
  * `devices.py` — Device registration, fingerprinting, and status monitoring.

---

# PART 2 — IMPLEMENTATION PROGRESS & STATUS TRACKER

| Ref # | Category | Description | Status | Notes |
|---|---|---|---|---|
| **P0-1** | Architecture | Unify `secure-gpt` & `secure-gpt-admin` into single codebase | ✅ **COMPLETED** | Deleted duplicate folder; configured multi-target Docker builds (`NEXT_PUBLIC_APP_MODE`). |
| **P0-2** | API / Infra | Configure multi-domain reverse proxy routing & dual backends | ✅ **COMPLETED** | Created `nginx.conf`, `docker-compose.yml`, `docker-compose.prod.yml` (8000/8001, 3000/3001). |
| **P0-3** | Stability | Fix infinite loop & pagination crash on `/users` page | ✅ **COMPLETED** | Safeguarded `apiGetPaginated` against unpaginated responses; removed unstable hook dependency. |
| **P0-4** | UI / RBAC | Role-scoped telemetry for Super Admin vs Org Admin | ✅ **COMPLETED** | Added Top Organizations table (Super Admin) & Top Users by Category (Org Admin). |
| **P0-5** | Security | Super Admin Access Guard & Dedicated Login views | ✅ **COMPLETED** | Added access-denied screen on admin domain and customized login without tenant tabs. |
| **P3-1** | Cleanup | Remove orphaned legacy backend service files | ✅ **COMPLETED** | Deleted `policy.service.py`, `log.service.py`, `device.service.py`. |
| **P3-2** | Constants | Standardize `policy-actions.constants.ts` | ✅ **COMPLETED** | Populated unified `POLICY_ACTIONS` & `SEVERITY_LEVELS`. |
| **P1-1** | Refactor | Chrome Extension large content scripts decomposition | ⏳ **REMAINING** | `interceptor.ts`, `site-detection-indicator.ts`, `radial-risk-gauge.ts`. |
| **P1-2** | Refactor | Dashboard oversized pages decomposition | ⏳ **REMAINING** | `versions/page.tsx`, `policy/page.tsx`, `CategoryCard.tsx`. |
| **P1-3** | Refactor | Detection OCR tier worker decomposition | ⏳ **REMAINING** | `ocrTier.ts` worker pool isolation. |
| **P2-1** | a11y | Accessibility & Focus trap in extension `ShieldModal` | ⏳ **REMAINING** | Keyboard trapping in Shadow DOM and ARIA attributes. |

---

# PART 3 — DETAILED REMAINING TASKS & ROADMAP

## 1. Chrome Extension Large Files Decomposition (P1-1)

| File Path | Current Line Count | Recommended Split Components | Priority |
|---|---|---|---|
| `packages/extension/src/content/interceptor.ts` | 513 | `InputInterceptor.ts`, `FileDropInterceptor.ts`, `ButtonInterceptor.ts`, `PolicyActionRouter.ts` | High |
| `packages/extension/src/content/site-detection-indicator.ts` | 561 | `DOMFloatingPill.ts`, `BadgeRenderer.ts`, `IndicatorDragManager.ts` | High |
| `packages/extension/src/content/radial-risk-gauge.ts` | 453 | `CanvasGaugeRenderer.ts`, `GaugePositionObserver.ts`, `RiskScoreCalculator.ts` | Medium |
| `packages/extension/src/background/detection-handler.ts` | 410 | `ScanRouter.ts`, `OffscreenBroker.ts`, `PolicyEvaluator.ts` | Medium |
| `packages/extension/src/content/modal-manager.tsx` | 365 | `ShadowDomHost.tsx`, `ExtensionModalRoot.tsx`, `HostStyleInjector.ts` | Medium |

## 2. Web Dashboard Large Files Decomposition (P1-2)

| File Path | Current Line Count | Recommended Split Components | Priority |
|---|---|---|---|
| `packages/secure-gpt-dashboard/src/app/versions/page.tsx` | 741 | Extract static changelog data to `src/config/versions.data.ts`; create `VersionFilterBar.tsx`, `ReleaseCard.tsx`, `VersionDetailDrawer.tsx` | High |
| `packages/secure-gpt-dashboard/src/app/(app)/policy/page.tsx` | 530 | Extract `usePolicyEditor.ts` state hook; extract `RuleOverrideModal.tsx`, `KeywordEditorModal.tsx` | High |
| `packages/secure-gpt-dashboard/src/features/policy/components/CategoryCard.tsx` | 529 | Extract `CategoryHeader.tsx`, `SensitivitySlider.tsx`, `RuleOverrideTable.tsx` | High |
| `packages/secure-gpt-dashboard/src/components/home/VersionHistorySection.tsx` | 508 | Reuse shared `ReleaseCard` component from `/versions` | Medium |

## 3. Detection Engine & Backend Decomposition (P1-3)

| File Path | Current Line Count | Recommended Split Components | Priority |
|---|---|---|---|
| `packages/detection/src/tiers/ocr/ocrTier.ts` | 381 | `TesseractWorkerPool.ts`, `ImagePreprocessor.ts`, `BoundingBoxParser.ts` | Medium |
| `backend/app/api/v1/admin/users.py` | 400 | Delegate DB queries and user mutation logic to `app/services/user_service.py` | Medium |

## 4. Accessibility (a11y) & UX Polish (P2-1)
* **Shadow DOM Focus Trap:** Update `packages/extension/src/features/shield-modal/components/ShieldModal.tsx` to trap Tab key focus within the modal and close cleanly on `Escape`.
* **ARIA Semantics:** Replace non-semantic `<div onClick=...>` elements with `<button>` or add `role="button"` and `tabIndex={0}`.
* **Color Contrast:** Validate that all muted text classes meet WCAG AA (4.5:1 ratio).

---

# PART 4 — REVISED CODEBASE HEALTH SCORE

| Dimension | Initial Score | Current Score | Improvement Summary |
|---|---|---|---|
| **Architecture & Structure** | 7.2 / 10 | **9.2 / 10** | Dual monorepo eliminated; single canonical codebase with clean mode builds. |
| **Deployment & Multi-Domain** | 6.0 / 10 | **9.5 / 10** | Dual Nginx reverse proxy + Docker compose for `securegpt.rkavach.com` & `admin.securegpt.rkavach.com`. |
| **Dashboard UI & Analytics** | 7.0 / 10 | **8.8 / 10** | Super Admin cross-tenant telemetry + Org Admin user/department breakdowns implemented. |
| **Security UX & RBAC** | 8.2 / 10 | **9.0 / 10** | Role guards, dedicated admin login, and confirmation modals for destructive operations. |
| **Code Maintainability** | 7.0 / 10 | **8.0 / 10** | Legacy service files deleted; pending completion of large files decomposition. |
| **Overall Health** | **7.5 / 10** | **8.9 / 10** | Major consolidation and multi-domain milestone achieved. |

---

# PART 5 — RECOMMENDED NEXT SPRINT

1. **Sprint 1 (Current Target):** Decompose Dashboard Oversized Files (`versions/page.tsx` 741 lines, `policy/page.tsx` 530 lines, `CategoryCard.tsx` 529 lines).
2. **Sprint 2:** Decompose Chrome Extension Content Scripts (`interceptor.ts` 513 lines, `site-detection-indicator.ts` 561 lines).
3. **Sprint 3:** Add Focus Trap & a11y improvements to extension `ShieldModal.tsx` and run final end-to-end multi-domain deployment verification.
