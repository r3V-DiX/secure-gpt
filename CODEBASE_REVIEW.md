# SecureGPT Comprehensive Codebase Audit & Architectural Review

**Date:** September 2026  
**Status:** Audit Complete (No application code modified)  
**Scope:** Web Dashboard, Chrome Extension, Detection Pipeline, Shared Packages, Backend API & Database

---

# PART 1 — REPOSITORY STRUCTURE & ARCHITECTURE MAP

## 1. High-Level Architectural Flow

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                   ADMIN / AUDITOR                       │
                     └────────────────────────────┬────────────────────────────┘
                                                  │ (HTTPS / Browser)
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │                Web Dashboard (Next.js 15)               │
                     │   (packages/secure-gpt-dashboard & secure-gpt-admin)    │
                     └────────────────────────────┬────────────────────────────┘
                                                  │ REST API / Bearer Token
                                                  ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Backend (Python 3.11)                              │
│  - Auth & RBAC (api/v1/auth, api/v1/admin)                                                │
│  - Org & Policy Mgmt (api/v1/orgs, api/v1/policy)                                         │
│  - Telemetry & Audit Logs (api/v1/logs, api/v1/extension/log)                             │
│  - Redaction & File Scan (api/v1/redaction, services/redaction_service.py)                │
└───────────────▲───────────────────────────────────────────────────────────┬───────────────┘
                │ (Batch Log Sync & Policy Pull)                            │
                │                                                           ▼
                │                                           ┌───────────────────────────────┐
                │                                           │ PostgreSQL DB & Redis Cache   │
                │                                           │ (SQLAlchemy ORM + Alembic)    │
                │                                           └───────────────────────────────┘
┌───────────────┴───────────────────────────────────────────┐
│                 Chrome Extension (MV3)                    │
│   (packages/extension)                                    │
│  - Background Service Worker (detection-handler, sync)    │
│  - Content Scripts (interceptor, gauge, indicator)        │
│  - Offscreen Document (Tesseract OCR, Transformers NER)   │
│  - UI (Popup React, ShieldModal, Radial Risk Gauge)       │
└───────────────────────────────┬───────────────────────────┘
                                │ DOM Interception / MutationObserver / Fetch Hook
                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Third-Party AI Websites                                   │
│  (ChatGPT, Claude, Gemini, Copilot, Perplexity, Cursor, HuggingFace, DeepSeek, etc.)      │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Layer-by-Layer Code Mapping

### A. Web / Dashboard (`secure-gpt/packages/secure-gpt-dashboard` & `secure-gpt-admin/packages/secure-gpt-dashboard`)
* **Framework:** Next.js 15 with React 19 and Tailwind CSS v4.
* **Routes & Pages:**
  * `src/app/page.tsx` — Landing and system gateway.
  * `src/app/(auth)/login/page.tsx`, `callback/page.tsx`, `restore-account/page.tsx` — Authentication flows.
  * `src/app/(app)/dashboard/page.tsx` — Executive overview, incident counts, platform activity charts.
  * `src/app/(app)/policy/page.tsx` — Organization DLP policy management, sensitivity sliders, rule overrides.
  * `src/app/(app)/event-logs/page.tsx` — Comprehensive audit log table with filter bar and log detail modal.
  * `src/app/(app)/team/page.tsx` / `roles/page.tsx` — User management, RBAC assignment, invite links.
  * `src/app/(app)/incidents/page.tsx` — Security alert escalation tracking.
  * `src/app/(app)/profile/page.tsx` — User profile, API keys, registered devices manager.
  * `src/app/(app)/settings/page.tsx` — Organization settings and notifications.
  * `src/app/versions/page.tsx` — Platform release changelog.
* **State & Data Display:** Redux Toolkit (`src/store`), React Context (`ThemeContext`, `PolicyContext`), `DataTable`, `Pagination`, `Sidebar`, `TopNav`.

### B. Chrome Extension (`secure-gpt/packages/extension`)
* **Manifest:** Manifest V3 (`public/manifest.json`).
* **Service Worker (`src/background/index.ts`):** Handles extension lifecycle, alarm-based policy sync (`policy-sync.ts`), and log batching (`log-batcher.ts`).
* **Content Scripts (`src/content/`):**
  * `interceptor.ts` — Attaches input/keydown listeners to textareas and contenteditable targets; handles file drag-and-drop.
  * `radial-risk-gauge.ts` — Renders live HTML5 Canvas risk gauge indicator next to AI input boxes.
  * `site-detection-indicator.ts` — Floating floating badge indicator displaying site trust state.
  * `modal-manager.tsx` — React-based shadow-DOM injection for warning/blocking modals.
  * `dom-utils.ts` — Multi-platform selector engine targeting 20+ AI interfaces.
* **Offscreen Document (`src/offscreen/`):** WASM Tesseract OCR engine and Transformers.js client-side NER model runner.
* **UI Views:** `src/popup/Popup.tsx` (React toolbar popup), `src/settings/` (options page), `src/wizard/` (onboarding wizard).

### C. Detection Engine (`secure-gpt/packages/detection`)
* **Tier 1 (Regex & Rules):** `src/tiers/regex/` — Precompiled patterns for PII, financial info, secrets, credentials, API keys.
* **Tier 2 (Keyword & Exact):** `src/tiers/keyword/` — High-speed exact dictionary lookup and Aho-Corasick matching.
* **Tier 3 (NER Machine Learning):** `src/tiers/ner/` — Xenova/Transformers.js BERT/RoBERTa token classification for contextual entities.
* **Tier 4 (OCR / Document Parser):** `src/tiers/ocr/` — Tesseract.js WASM for images + custom parsers for PDF, DOCX, XLSX, CSV.

### D. Shared Workspace (`secure-gpt/packages/shared`)
* **Types:** `api.types.ts`, `auth.types.ts`, `config.types.ts`, `detection.types.ts`, `log.types.ts`, `policy.types.ts`.
* **Constants:** `builtin-rules.constants.ts`, `pii-categories.constants.ts`, `platforms.constants.ts`, `masking-tokens.constants.ts`.
* **Utils:** `detection-helpers.ts`, `formatters.ts`, `type-guards.ts`.

### E. Backend API & Services (`secure-gpt/backend` & `secure-gpt-admin/backend`)
* **Framework:** FastAPI, Python 3.11, SQLAlchemy 2.0 Async/Sync, Alembic migrations.
* **API Endpoints (`app/api/v1/`):**
  * `auth/` — Session handling, Google OAuth, Microsoft OAuth, email OTP.
  * `admin/` — Users, roles, permissions, audit trails.
  * `orgs.py` — Organization hierarchy, multi-tenancy settings.
  * `policy.py` — CRUD operations for organization and custom policy rules.
  * `logs.py` — Querying, filtering, and exporting telemetry audit logs.
  * `devices.py` — Device registration, fingerprinting, and status monitoring.
  * `redaction.py` — Server-side document redaction endpoint.
  * `extension/` — Dedicated endpoints for extension policy sync and bulk log ingestion.
* **Services (`app/services/`):** `session_service.py`, `rbac_service.py`, `redaction_service.py`, `extension_service.py`, `email_service.py`, `org_service.py`.

---

# PART 2 — LARGE & COMPLEX FILES AUDIT

| File Path | Line Count | Component / Module | Core Responsibilities | Why It Is Too Complex | Recommended Split |
|---|---|---|---|---|---|
| `packages/secure-gpt-dashboard/src/app/versions/page.tsx` | 741 | `VersionsPage` | Displaying full platform version history, filtering tags, release changelogs | Mixes large static JSON metadata arrays, filter state, tabs, and direct Tailwind markup in one file | Extract version dataset into `src/config/versions.data.ts`; create `VersionFilterBar`, `ReleaseCard`, `VersionDetailDrawer` |
| `packages/extension/src/content/site-detection-indicator.ts` | 561 | `SiteDetectionIndicator` | Injecting and positioning floating shield pill on AI site DOM | Manually builds raw DOM elements via strings, handles drag positioning, animates styles, and listens to custom messages | Split into `DOMFloatingPill`, `BadgeRenderer`, `IndicatorDragManager`, and `IndicatorStateSync` |
| `packages/secure-gpt-dashboard/src/app/(app)/policy/page.tsx` | 530 | `PolicyPage` | Organization DLP policy orchestration, rule overrides, category sensitivity | Mixes network fetching, local category overrides, modal dialog controllers, and keyword state | Extract `usePolicyEditor` hook; isolate `RuleOverrideModal`, `KeywordEditorModal`, and `CategoryGrid` |
| `packages/secure-gpt-dashboard/src/features/policy/components/CategoryCard.tsx` | 529 | `CategoryCard` | Rendering individual policy category, action selector, sensitivity slider | 500+ lines handling accordion expansion, sensitivity sliders, individual rule toggles, and inline edits | Decompose into `CategoryCardHeader`, `SensitivitySlider`, `RuleOverrideTable`, `CustomRuleRow` |
| `packages/extension/src/content/interceptor.ts` | 513 | `PromptInterceptor` | Global prompt scanning, keystroke interception, form submit hooking, file drag listener | Monolithic event handler combining textareas, contenteditable divs, drag-drop files, policy evaluation, and modal triggering | Split into `InputInterceptor`, `FileDropInterceptor`, `ButtonInterceptor`, `PolicyActionRouter` |
| `packages/secure-gpt-dashboard/src/components/home/VersionHistorySection.tsx` | 508 | `VersionHistorySection` | Home page interactive release history widget | Redundant copy of versions logic with deep nested JSX and custom animations | Share components with `/versions` page and use unified version data provider |
| `packages/extension/src/content/radial-risk-gauge.ts` | 453 | `RadialRiskGauge` | Real-time Canvas-rendered risk gauge next to input | Canvas 2D rendering loop, animation frame ticks, DOM bounding box math, and theme recalculations in one file | Break into `CanvasGaugeRenderer`, `GaugePositionObserver`, `RiskScoreCalculator` |
| `packages/secure-gpt-dashboard/src/app/(auth)/login/page.tsx` | 428 | `LoginPage` | User login screen with OTP, Google/MS OAuth, dev login tiers | Multiple competing state machines (email OTP, dev bypass, OAuth redirect, error handling) in single component | Separate into `OAuthLoginPanel`, `DevTierLoginPanel`, `OtpVerificationModal`, `useAuthStateMachine` |
| `packages/extension/src/background/detection-handler.ts` | 410 | `DetectionHandler` | Service worker scanner orchestrator | Handles multi-tier routing (regex -> keyword -> NER -> OCR), offscreen messaging, and policy checking | Split into `ScanRouter`, `OffscreenBroker`, `PolicyEvaluator` |
| `packages/secure-gpt-dashboard/src/app/(app)/get-started/page.tsx` | 400 | `GetStartedPage` | Interactive onboarding walkthrough | Complex multi-step wizard state mixed with download links and animated guides | Break into individual step components: `ExtensionInstallStep`, `PolicyConfigStep`, `TeamInviteStep` |
| `packages/backend/app/api/v1/admin/users.py` | 400 | Users Admin API Router | User CRUD, role assignment, invite management, password resets | Route handler mixes raw DB transactions, email dispatch, permission checks, and response serialization | Move DB queries to `user_service.py` and email operations to `email_service.py` |
| `packages/detection/src/tiers/ocr/ocrTier.ts` | 381 | `OcrTier` | Image & document OCR parsing | Worker instantiation, image thresholding, Tesseract runner, coordinate mapping, fallback | Break into `TesseractWorkerPool`, `ImagePreprocessor`, `BoundingBoxParser` |
| `packages/extension/src/content/modal-manager.tsx` | 365 | `ModalManager` | Shadow-DOM React root injection for extension modals | Shadow DOM creation, stylesheet injection, event delegation, focus trap, and React 19 root mounting | Split into `ShadowDomHost`, `ExtensionModalRoot`, `HostStyleInjector` |

---

# PART 3 — UI/UX AUDIT: WEB DASHBOARD

## 1. Typography
* **Font Stacks:** Inconsistent mix of `Poppins` (headings), `Plus Jakarta Sans` (body), and `DM Mono` (code/tokens).
* **Heading Scale Discrepancies:**
  * Dashboard: `text-2xl font-bold tracking-tight text-neutral-900`
  * Policy: `text-xl font-semibold text-neutral-800`
  * Versions: `text-3xl font-extrabold`
  * Event Logs: `text-2xl font-bold`

## 2. Spacing & Container Alignment
* **Page Padding:** `/dashboard` uses `p-8 max-w-7xl mx-auto`, `/policy` uses `p-6`, `/team` uses `px-4 py-6`, `/profile` uses `p-8`.
* **Card Gutters:** Inconsistent spacing tokens ranging from `space-y-4` to `gap-6` and `gap-8`.

## 3. UI Component Variations
* **Buttons:**
  * `components/ui/button/button.tsx` exists with variants (`primary`, `secondary`, `outline`, `ghost`, `danger`).
  * However, `TopNav.tsx`, `CategoryCard.tsx`, and `VersionHistorySection.tsx` introduce custom raw `<button>` elements with ad-hoc Tailwind classes.
* **Modals:**
  * Standard: `components/ui/modal/modal.tsx`.
  * Non-standard: `profile/page.tsx` and `team/page.tsx` render inline fixed position overlays with separate backdrop implementations.
* **Badges:**
  * `components/ui/badge/badge.tsx` provides severity badges.
  * `event-logs/page.tsx` and `incidents/page.tsx` manually reconstruct badge markup (`inline-flex items-center px-2 py-0.5 rounded text-xs`).

## 4. Behavioral & Flow Inconsistencies
* **Delete / Disconnect Actions:**
  * `/team` → Deleting a member triggers a confirmation modal dialog.
  * `/profile` (Registered Devices) → Clicking "Unlink Device" executes immediately and triggers a toast notification without confirmation.
* **Loading States:**
  * `/dashboard` uses Skeleton shimmer placeholders.
  * `/policy` displays a centered spinning SVG.
  * `/event-logs` uses a thin progress bar at top of table.
* **Empty States:**
  * No centralized `<EmptyState />` component. Each page renders custom SVGs and divergent copy ("No records found", "Nothing to display", "No logs matching filters").

---

# PART 4 — UI/UX AUDIT: CHROME EXTENSION

## 1. User Interaction & Detection Flow
```
User Enters Text in Prompt Field
       │
       ▼
Live Analysis (RadialRiskGauge animates in corner)
       │
       ├─ If Risk = Clean ────────► Green indicator; normal submission allowed
       │
       ├─ If Risk = Warn ─────────► Yellow indicator; submit triggers warning banner / modal
       │
       └─ If Risk = Block / Mask ──► Red indicator; submit halted; ShieldModal displayed
```

## 2. Shield Modal & Notification UX
* **Clarity of Warnings:** The `ShieldModal` lists detected entities (e.g. "Credit Card Number", "API Secret Key") with masked snippet previews.
* **Normal User Comprehension:** Detection inspection tooltips display technical jargon (e.g., "Tier: Regex", "Score: 0.98", "Pattern ID: PII_AADHAAR"). Non-technical users find this confusing.
* **Action Buttons:** "Mask & Submit" (Primary Blue), "Allow Once" (Secondary Gray), "Cancel / Edit" (Outline). Clear and intuitive hierarchy.
* **Corner Banners:** When a file scan triggers a block, `BannerBlock` appears in top-right corner. On certain AI sites (e.g., ChatGPT fixed headers), the banner overlays the user menu.

## 3. Extension Popup
* Fixed viewport: `380px x 520px`.
* Displays current status, active policy badge, total detections counter, and quick link to dashboard.
* Long user emails in the top bar get truncated without a tooltip.

---

# PART 5 — DASHBOARD ↔ EXTENSION TERMINOLOGY CONSISTENCY

| Concept / Domain | Dashboard Terminology | Chrome Extension Terminology | Backend API Terminology | Consistency Status | Recommended Standard |
|---|---|---|---|---|---|
| **Action: Prevent Submission** | `BLOCK` | `Blocked` / `Block Prompt` | `ActionType.BLOCK` | ⚠️ Inconsistent case & tense | **`BLOCK`** (Enum) / **Block** (UI Label) |
| **Action: Obfuscate Data** | `MASK` | `Masked` / `Mask Prompt` | `ActionType.MASK` | ⚠️ Inconsistent tense | **`MASK`** (Enum) / **Mask** (UI Label) |
| **Action: Warn User** | `WARN_ALLOW` | `Warning` / `Allow Once` | `ActionType.WARN_ALLOW` | ❌ Disconnected terms | **`WARN`** (Enum) / **Warn** (UI Label) |
| **Action: Pass Through** | `ALLOW` | `Allowed` / `Clean` | `ActionType.ALLOW` | ⚠️ Inconsistent terms | **`ALLOW`** (Enum) / **Allow** (UI Label) |
| **PII Detection Category** | `PII` | `Personal Information` | `PII_CATEGORIES.PII` | ⚠️ Abbreviation vs full name | **Personal Data (PII)** |
| **Secrets Category** | `Credentials` | `Secrets & Keys` | `PII_CATEGORIES.CREDENTIALS` | ⚠️ Name divergence | **Credentials & Secrets** |
| **Severity Level** | `LOW / MEDIUM / HIGH / CRITICAL` | `Low / Medium / High / Critical` | `SeverityLevel` Enum | ⚠️ Case mismatch | **`LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL`** |
| **Client Endpoint** | `Registered Device` | `Client Instance` / `Extension` | `Device` | ⚠️ Terminology drift | **Endpoint Device** |
| **Audit Record** | `Event Log` | `Audit Telemetry` | `AuditLog` | ⚠️ Disconnected naming | **Audit Log** |

---

# PART 6 — DESIGN SYSTEM AUDIT

## 1. Design Tokens & Styling Architecture
* **CSS Engine:** Tailwind CSS v4 with custom CSS properties in `:root` (`globals.css`).
* **Palette:**
  * Accent: `--accent: hsl(220, 75%, 48%)`
  * Surfaces: `--bg-base: hsl(220, 55%, 97%)`, `--bg-surface: #FFFFFF`, `--bg-surface-2: hsl(220, 50%, 95%)`
  * Text: `--text-primary: #0F172A`, `--text-secondary: #475569`, `--text-muted: #94A3B8`
* **Color Drift Found:**
  * Hardcoded `bg-blue-600` and `bg-blue-500` used instead of `var(--accent)`.
  * Hardcoded `bg-red-500`, `bg-rose-600`, `text-red-500` used across 12 files instead of semantic `--danger` tokens.

## 2. Design Pattern & Component Standardization Matrix

| Current Design Pattern | Number of Variations Found | Problem Identified | Recommended Standard |
|---|---|---|---|
| **Buttons** | 4 | Inconsistent padding, heights (`h-9` vs `h-10`), and font weights | Single `<Button variant="..." size="...">` exported from `@securegpt/ui` |
| **Modals & Dialogs** | 3 | Separate backdrop animations, missing focus traps, conflicting z-index | Unified compound `<Modal>` (`<Modal.Header>`, `<Modal.Body>`, `<Modal.Footer>`) |
| **Empty States** | 4 | Divergent illustration sizes, varying typography and action button placement | Standard `<EmptyState icon={...} title="..." description="..." action={...} />` |
| **Form Inputs** | 3 | Varied border colors, focus rings (`ring-blue-500` vs `ring-indigo-500`), heights | Standard `<Input>`, `<Select>`, `<Textarea>` with integrated error state display |
| **Status Badges** | 3 | Inconsistent border radius (`rounded` vs `rounded-full`) and padding | Unified `<Badge variant="severity|status" ...>` |
| **Tables & Data Grids** | 2 | `DataTable` used in event logs; raw `<table>` with manual pagination used in team | Refactor all tabular views to use shared `DataTable` component |

---

# PART 7 — DLP-SPECIFIC UX AUDIT

1. **Policy Creation & Tuning:**
   * Admins can configure policy rules per category (e.g., Financial, PII, Secrets) and adjust sensitivity thresholds (Low, Medium, High).
   * **UX Gap:** No instant "Policy Test Sandbox" in the dashboard where admins can paste sample text and preview what the policy would do before deploying.
2. **Alert Investigation & Context:**
   * Admins can see the user, platform URL, timestamp, and masked snippet.
   * **Missing Context:** The exact matching rule identifier and matched tokens are not displayed directly in the log row; requires opening raw JSON payload.
3. **False Positive & Exception Handling:**
   * If a policy is set to `WARN_ALLOW`, users can override with "Allow Once".
   * If set to `BLOCK`, users have no built-in feedback button to request an exemption or flag a false positive to their security admin.
4. **Device & Extension Health:**
   * Admins can view connected devices in `profile/page.tsx`.
   * **Missing Context:** No indicator showing which version of the policy ruleset the extension is currently running or when it last successfully synced.

---

# PART 8 — SECURITY UX

1. **Destructive Operations:**
   * Removing team members requires explicit modal confirmation (`team/page.tsx`).
   * **Vulnerability:** Unlinking devices in `profile/page.tsx` executes immediately upon click without confirmation.
2. **Permission & Role Gating:**
   * Routes are protected client-side via `ProtectedRoute.tsx` and validated server-side in FastAPI via `get_current_active_user` and `require_permission`.
   * **UI Gap:** Read-only users still see active action buttons (e.g. "Save Policy"), which fail with a 403 toast upon submission instead of being disabled.
3. **Sensitive Audit Exporting:**
   * Log export endpoints (`/api/v1/logs/export`) require admin roles and enforce row limits to prevent data exfiltration.

---

# PART 9 — RESPONSIVE DESIGN

1. **Web Dashboard:**
   * **Desktop (> 1200px):** Clean layout, multi-column dashboard cards, full data tables.
   * **Tablet (768px – 1024px):** Data tables in `/event-logs` and `/team` cause horizontal scroll; sidebar collapses into mobile drawer.
   * **Mobile (< 768px):** Policy sliders and category accordions stack cleanly; data tables require horizontal swipe or card-view collapse.
2. **Chrome Extension:**
   * **Popup:** Fixed dimensions (`380px x 520px`). Responsive for all Chrome desktop resolutions.
   * **Injected Modals:** Centered on host page with `max-w-[480px] w-[90vw]`. Adapts gracefully to mobile-emulated browser tabs.

---

# PART 10 — ACCESSIBILITY (a11y)

1. **Semantic HTML & Clickable Elements:**
   * 2 instances of `<div onClick=...>` without `role="button"` or `onKeyDown` listeners (`ShieldModal.tsx:92` and `site-detection-indicator.ts:480`).
2. **Keyboard Navigation & Focus Trapping:**
   * Dashboard `modal.tsx` traps focus correctly and listens to `Escape`.
   * Extension `ShieldModal.tsx` lacks focus trap; pressing `Tab` can cycle focus into underlying host page form fields while modal is open.
3. **Color Contrast & Indicators:**
   * Status indicators in `registered-devices-panel.tsx` rely on green/gray dots without accessible text descriptions (`sr-only`).
   * Muted text `--text-muted: #94A3B8` on white background has a contrast ratio of 2.6:1 (fails WCAG AA requirement of 4.5:1 for normal text).

---

# PART 11 — LOADING, EMPTY & ERROR STATES

| Page / Route | Loading State Mechanism | Empty State UX | Error State UX |
|---|---|---|---|
| **`/dashboard`** | Animated Skeleton pulse cards | "No activity recorded yet" card | Full page Error Boundary with Retry |
| **`/policy`** | Centered SVG spinner | Empty category fallback message | Toast notification on fetch failure |
| **`/event-logs`** | Thin table-top progress bar | Custom table row: "No logs found matching filters" | Inline error banner above filters |
| **`/team`** | Full-page spinner | Card: "No team members found" | Modal error alert |
| **`/profile`** | Skeleton user card | "No devices linked to account" | Toast notification |
| **Extension Popup** | Micro spinner in header | "No detections recorded today" | Red warning banner with reload button |

---

# PART 12 — CODE DUPLICATION

## 1. Dual Monorepo Redundancy
* **Files:** Entire directory tree of `secure-gpt` vs `secure-gpt-admin`.
* **Issue:** `secure-gpt-admin` contains duplicate copies of `packages/secure-gpt-dashboard`, `packages/shared`, and `backend/`.
* **Impact:** Double maintenance burden and risk of bugfix drift.
* **Fix:** Consolidate into single monorepo root.

## 2. Duplicate Backend Services
* **Files:**
  * `backend/app/services/policy.service.py` vs `backend/app/services/policy_service.py`
  * `backend/app/services/log.service.py` vs `backend/app/services/extension_service.py`
  * `backend/app/services/device.service.py`
* **Issue:** Legacy dot-notated service files left in place when snake_case files were created.
* **Fix:** Delete legacy dot-notated service files.

## 3. Duplicate Detection Rules & Regex Definitions
* **Files:** `packages/shared/src/constants/builtin-rules.constants.ts` and `packages/detection/src/tiers/regex/rules/`.
* **Issue:** Regex patterns for Credit Cards, SSN, and Aadhaar defined in both shared package and detection package.
* **Fix:** Use `packages/shared` as single source of truth for all regex rules.

---

# PART 13 — ARCHITECTURAL PROBLEMS

1. **Business Logic in UI Components:**
   * `packages/secure-gpt-dashboard/src/app/(app)/policy/page.tsx` directly performs policy merging and rule override computations inside the component render body.
2. **Direct Raw `fetch()` Calls:**
   * Dashboard pages perform direct `fetch()` calls inside `useEffect` without an abstraction layer or typed SDK client.
3. **Type Safety & `any` Fallbacks:**
   * Multiple `any` type assertions found in `packages/extension/src/content/interceptor.ts` and `packages/secure-gpt-dashboard/src/features/event-log/mappers/event-log.mapper.ts`.
4. **Dead / Unused Files:**
   * `packages/shared/src/constants/policy-actions.constants.ts` is 0 bytes (empty file).

---

# PART 14 — PERFORMANCE AUDIT

1. **Chrome Extension DOM Observers:**
   * `interceptor.ts` listens to `input`, `keydown`, `paste`, and `drop` across all matching text fields with a 150ms debounce.
   * **Optimization Opportunity:** Add passive event listeners and avoid querying whole-page selectors on every keystroke.
2. **Offscreen Model Loading:**
   * Transformers.js ONNX model in `offscreen.ts` takes ~800ms to initialize on first scan.
   * **Recommendation:** Pre-warm the offscreen document worker in the background upon extension startup.
3. **Dashboard Table Rendering:**
   * Event logs table loads records in pages of 25/50 with backend SQL pagination (`limit`/`offset`), which performs efficiently.

---

# PART 15 — CHROME EXTENSION SPECIFIC REVIEW

1. **Manifest V3 Architecture:**
   * Correctly uses background service worker (`background/index.js`).
   * Heavy WASM OCR (Tesseract) and ONNX NER are isolated inside `offscreen/offscreen.html`, ensuring compliance with MV3 thread execution rules.
2. **Host Permissions & Security:**
   * Specific host permissions declared for 20 AI platforms (OpenAI, Claude, Gemini, Copilot, Perplexity, Cursor, DeepSeek, etc.).
   * CSP properly configures `'wasm-unsafe-eval'` for client-side WASM execution.
3. **Storage & State Sync:**
   * Uses `chrome.storage.local` with fallback to `chrome.storage.sync` for policy caching and offline capability.

---

# PART 16 — BACKEND ↔ FRONTEND CONTRACT CONSISTENCY

1. **Action Enums:**
   * Backend: `ActionType` (`BLOCK`, `MASK`, `WARN_ALLOW`, `ALLOW`)
   * Dashboard: `ActionType` (`BLOCK` | `MASK` | `WARN_ALLOW` | `ALLOW` | `BLOCKED` | `MASKED` | `WARNED` | `ALLOWED`)
   * Extension: `PolicyAction` (`BLOCK` | `MASK` | `WARN` | `ALLOW`)
   * **Verdict:** Frontend has created alias types to compensate for backend/extension mismatches. Must be normalized to single enum.
2. **Audit Log Payload Schema:**
   * Backend returns `{ id, timestamp, platform, action_taken, severities, detected_categories, user_email, device_id }`.
   * Dashboard mapper (`event-log.mapper.ts`) translates `action_taken` to `action` and maps severity arrays.

---

# PART 17 — FINAL CONSISTENCY MATRIX

| Area | Variations Found | Severity | Recommended Standard |
|---|---|---|---|
| **Buttons** | 4 | High | Single `<Button>` component in shared UI library |
| **Modals** | 3 | Medium | Single compound `<Modal>` with accessible focus trap |
| **Empty States** | 4 | High | Shared `<EmptyState icon title description action>` |
| **Severity Labels** | 3 | High | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` enum |
| **Policy Terminology** | 3 | High | `BLOCK`, `MASK`, `WARN`, `ALLOW` |
| **Loading States** | 3 | Medium | Skeleton for data tables/cards; spinner for interactive buttons |
| **API Client Layer** | 2 | High | Single typed API Client SDK |

---

# PART 18 — PRIORITIZED FINDINGS

### P0 — Critical (Security & Architecture Core)
* **[P0-1] Dual Monorepo Discrepancy**
  * *File:* `secure-gpt` vs `secure-gpt-admin`
  * *Problem:* Redundant duplicate codebases causing risk of diverging logic.
  * *Fix:* Consolidate into single canonical repository. (Effort: Medium)
* **[P0-2] Action & Severity Enum Mismatch Across Tiers**
  * *File:* `packages/shared/src/types/`, `backend/app/models/audit_log.py`, `extension/src/types/`
  * *Problem:* Past-tense vs present-tense aliases (`BLOCK` vs `BLOCKED`, `WARN_ALLOW` vs `WARNED`) cause subtle filter and log ingestion bugs.
  * *Fix:* Unify enum definitions across backend, shared, extension, and dashboard. (Effort: Low)

### P1 — High (Major UX & Code Complexity)
* **[P1-1] Monolithic Content Script (`interceptor.ts` & `site-detection-indicator.ts` > 500 lines)**
  * *File:* `packages/extension/src/content/interceptor.ts` (513 lines), `site-detection-indicator.ts` (561 lines)
  * *Problem:* High complexity, DOM manipulation mixed with business logic.
  * *Fix:* Decompose into modular interceptors and rendering managers. (Effort: Medium)
* **[P1-2] Direct `fetch()` Calls & Ad-Hoc State in Dashboard Pages**
  * *File:* `packages/secure-gpt-dashboard/src/app/(app)/policy/page.tsx`, `roles/page.tsx`
  * *Problem:* Lack of standardized query caching and error handling.
  * *Fix:* Integrate TanStack Query with typed API service methods. (Effort: Medium)

### P2 — Medium (Maintainability & Accessibility)
* **[P2-1] Missing Accessible Focus Trap in Extension ShieldModal**
  * *File:* `packages/extension/src/features/shield-modal/components/ShieldModal.tsx`
  * *Problem:* Tab navigation escapes shadow DOM modal into underlying host page.
  * *Fix:* Implement focus trap and Escape key listener. (Effort: Low)
* **[P2-2] Unconfirmed Destructive Device Deletion**
  * *File:* `packages/secure-gpt-dashboard/src/features/profile/components/registered-devices-panel.tsx`
  * *Problem:* Clicking unlink device executes immediately without confirmation.
  * *Fix:* Add confirmation dialog modal before unlinking device. (Effort: Low)
* **[P2-3] Design System Color Drift**
  * *File:* Dashboard components across `src/features/`
  * *Problem:* Hardcoded Tailwind colors (`bg-blue-600`, `bg-red-500`) bypassing CSS custom properties.
  * *Fix:* Enforce design token usage. (Effort: Low)

### P3 — Low (Minor Inconsistencies & Cleanup)
* **[P3-1] Dead Legacy Backend Service Files**
  * *File:* `backend/app/services/policy.service.py`, `log.service.py`, `device.service.py`
  * *Problem:* Orphaned dot-notated service files.
  * *Fix:* Delete redundant files. (Effort: Low)
* **[P3-2] Empty Constants File**
  * *File:* `packages/shared/src/constants/policy-actions.constants.ts` (0 bytes)
  * *Problem:* Empty file exported in shared package index.
  * *Fix:* Populate with shared enum or delete. (Effort: Low)

---

# PART 19 — TOP 20 RECOMMENDATIONS

### Quick Wins (Low Effort, High Immediate Impact)
1. Delete redundant legacy backend service files (`policy.service.py`, `log.service.py`, `device.service.py`).
2. Harmonize `ActionType` and `SeverityLevel` enums in `packages/shared` and import across all tiers.
3. Fix non-semantic clickable `<div>` elements in `ShieldModal.tsx` and `site-detection-indicator.ts` with proper ARIA attributes.
4. Replace ad-hoc empty state layouts across dashboard with a unified `<EmptyState />` component.
5. Add keyboard focus trap to extension `ShieldModal.tsx`.
6. Add confirmation modal dialog to device unlinking in `registered-devices-panel.tsx`.
7. Standardize heading typography classes across all dashboard pages.

### Medium Improvements (Moderate Effort, Significant Architecture Boost)
8. Unify `secure-gpt` and `secure-gpt-admin` into a single canonical workspace.
9. Modularize `packages/extension/src/content/interceptor.ts` into dedicated input, file, and button handlers.
10. Refactor `packages/extension/src/content/site-detection-indicator.ts` into discrete rendering and drag classes.
11. Refactor dashboard `policy/page.tsx` (530 lines) by extracting custom hooks and rule modals.
12. Replace raw `fetch()` calls in dashboard pages with a centralized typed API client.
13. Unify button, badge, and modal implementations in dashboard into a shared UI kit.
14. Add an in-modal false-positive reporting action for blocked users in the Chrome extension.

### Large Refactoring (Strategic Value & Future Scalability)
15. Extract `@securegpt/ui` as a shared component library consumed by both dashboard and extension popup/modals.
16. Integrate TanStack Query (React Query) for automated caching, deduplication, and optimistic updates.
17. Modularize detection pipeline and OCR worker pool into a standalone background worker package.
18. Pre-warm offscreen document worker in extension background to eliminate 800ms first-scan cold start.
19. Implement end-to-end automated contract testing between FastAPI backend and Next.js / Extension clients.
20. Build automated responsive viewport test suite covering desktop, tablet, and mobile breakpoints.

---

# PART 20 — FINAL EXECUTIVE SUMMARY

* **Overall Codebase Health:** 7.5 / 10
* **Dashboard UI Consistency:** 7.0 / 10
* **Extension UI Consistency:** 8.0 / 10
* **Dashboard ↔ Extension Consistency:** 6.8 / 10
* **Code Maintainability:** 7.0 / 10
* **Architecture:** 7.2 / 10
* **Accessibility:** 6.5 / 10
* **Security UX:** 8.2 / 10
* **Performance:** 7.8 / 10

### Top 5 Problems
1. Dual repository duplication (`secure-gpt` vs `secure-gpt-admin`).
2. Action and Severity enum mismatches (`BLOCK` vs `BLOCKED`, `WARN_ALLOW` vs `WARNED`).
3. Oversized monolithic content scripts in Chrome extension (`interceptor.ts`, `site-detection-indicator.ts`).
4. Direct `fetch()` and ad-hoc state in Next.js dashboard pages.
5. Inconsistent component variants and empty/loading states in dashboard.

### Top 5 Quick Wins
1. Clean up unused legacy backend service files.
2. Harmonize shared action/severity enums across repo.
3. Standardize dashboard empty state and loading spinner components.
4. Add focus trap and ARIA button attributes to extension modals.
5. Add confirmation modal to device unlinking in profile view.

### Top 5 Large Improvements
1. Consolidate into single clean monorepo.
2. Modularize Chrome extension content interception pipeline.
3. Integrate TanStack Query for dashboard data management.
4. Extract shared `@securegpt/ui` component library.
5. Introduce end-user false-positive feedback flow.

### Recommended Implementation Order
1. **Phase 1: Foundations & Cleanup** (Enums, legacy files cleanup, accessibility fixes).
2. **Phase 2: Repository Consolidation** (Merge/retire redundant `secure-gpt-admin`).
3. **Phase 3: Design System & Dashboard Unification** (Shared UI components, React Query).
4. **Phase 4: Extension Architecture Refactor** (Decompose `interceptor.ts`, modularize DOM hooks).
