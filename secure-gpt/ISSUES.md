# SecureGPT — Bug Tracker

All known issues found during audit. Status updated as fixes are applied.

---

## CRITICAL

### Bug 1 — `isRunning` race: concurrent submits bypass the guard
**File:** `packages/extension/src/content/interceptor.ts:139`  
**Status:** ✅ Fixed

`handleSubmit` awaits `GET_STATE` from the background before setting `isRunning = true`. During that async gap, a second keydown or click event can call `handleSubmit` again. Both calls pass `if (isRunning) return` and run detection concurrently — resulting in two modals, double-logging, or double-submission.

**Fix:** Set `isRunning = true` synchronously at the very top of `handleSubmit`, before the first `await`.

---

### Bug 2 — `AUTH_SUCCESS` message unhandled: interceptor never starts after login
**File:** `packages/extension/src/content/index.ts:44`  
**Status:** ✅ Fixed

Background broadcasts `{ type: 'AUTH_SUCCESS' }` to all tabs after OAuth. The content script's message listener handles `POLICY_UPDATED`, `EXTENSION_PAUSED`, `EXTENSION_RESUMED`, `AUTH_LOST` — but not `AUTH_SUCCESS`. Any page open before the user logs in never starts the interceptor. User must manually refresh every open LLM tab.

**Fix:** Add `if (message.type === 'AUTH_SUCCESS') void init()` to the content script listener.

---

### Bug 3 — `onMessage` listener added on every `init()` call: exponential accumulation
**File:** `packages/extension/src/content/index.ts:44`  
**Status:** ✅ Fixed

`init()` registers a new `chrome.runtime.onMessage.addListener` every time it's called. The listener is never removed. `EXTENSION_RESUMED` triggers `init()` again — adding another listener. After N resume cycles, every message fires N+1 times. Leads to multiple interceptors and multiple modal popups per submit.

**Fix:** Extract the listener as a named top-level function, register it once outside `init()`, never re-register.

---

### Bug 4 — Expired pause never clears: extension stays paused forever
**File:** `packages/extension/src/lib/storage/storage.ts:131`  
**Status:** ✅ Fixed

`stateStorage.isActive()` checks `pausedUntil` correctly but falls through to `return active` which is still `false`. When the pause window expires the check `new Date(pausedUntil) > new Date()` is `false`, so control falls through to `return active` — which was set to `false` when the pause was created. Extension remains paused indefinitely with no recovery except a manual Resume click.

**Fix:** After the `pausedUntil` date check fails (pause expired), clear both `pausedUntil` and reset `isActive` to `true`.

---

### Bug 5 — PDF redaction to backend is unauthenticated
**File:** `packages/extension/src/background/detection-handler.ts:220`  
**Status:** ✅ Fixed

`handleRedactPDF` calls raw `fetch` directly to `API_BASE_URL` (`api.securegpt.rkavach.com`) with no `credentials: 'include'` and no auth headers. The session cookie lives on the dashboard domain, not the API domain, so every PDF redaction call 401s in production. All other API calls correctly use `apiClient` (Axios with `withCredentials: true` proxied via the dashboard URL).

**Fix:** Replace raw `fetch` with `apiClient.post` using the dashboard proxy URL, matching every other API call.

---

### Bug 6 — `phone` validator missing from `regexTier.ts`: phone numbers never validated
**File:** `packages/extension/src/tiers/regex/regexTier.ts:18`  
**Status:** ✅ Fixed

`regexTier.ts` defines its own local `VALIDATORS` object that includes `luhn`, `verhoeff`, `pan` — but not `phone`. The `pii.phone_global` rule has `validatorId: 'phone'`. Since `VALIDATORS['phone']` is `undefined`, the guard `if (validator && !validator(value))` is always `false` — every regex match passes without libphonenumber-js validation. The phone regex is intentionally loose, so any number-like sequence gets flagged.

**Fix:** Import `phoneCheck` from the validators barrel and add `phone: phoneCheck` to the `VALIDATORS` map.

---

### Bug 0 (Gmail) — Content script activates on all `*.google.com` pages
**File:** `packages/extension/public/manifest.json:23`  
**Status:** ✅ Fixed (previous session)

Manifest `matches` used `https://*.google.com/*` and `https://*.microsoft.com/*` — injecting the content script into Gmail, Docs, Drive, Outlook, Teams, etc. The interceptor then scanned and blocked email addresses in Gmail compose windows.

**Fix:** Narrowed to `https://gemini.google.com/*` and `https://copilot.microsoft.com/*`. Added hostname guard in `content/index.ts`.

---

## HIGH

### Bug 7 — Three validators referenced but not implemented: IBAN, JWT, generic API key pass unvalidated
**File:** `packages/detection/src/rules/confidential/index.ts`, `packages/detection/src/rules/financial/index.ts`  
**Status:** ✅ Fixed

These `validatorId` values are referenced in rules but have no implementation:
- `'mod97'` — IBAN rule
- `'jwt_parser'` — JWT token rule  
- `'entropy'` — Generic API key rule

Because `VALIDATORS['mod97']` etc. return `undefined`, every match is accepted without validation. Causes significant false positives: any numeric sequence of the right length matches IBAN, anything starting with `eyJ` matches JWT.

**Fix:** Implement `mod97Check` (IBAN checksum), `jwtParserCheck` (structural 3-part base64 validation), and `entropyCheck` (Shannon entropy ≥ 3.5 bits/char). Register all three in the validators barrel.

---

### Bug 8 — OCR path skips NER: text in images only gets regex-scanned
**File:** `packages/extension/src/offscreen/offscreen.ts:175`  
**Status:** ✅ Fixed

`runImageOcr` in the offscreen document only runs `regexTier.run()` on the OCR-extracted text. But `pipeline.ts`'s `detectPIIFromImage` runs both regex AND NER before mapping bboxes. Freeform names, addresses, and contextual PII that NER catches but regex misses are never detected in pasted images.

**Fix:** Import and instantiate `NERTier` in the offscreen document. Mirror the same regex → NER cascade (with regex-masking between tiers) that `detectPIIFromImage` uses before calling `mapEntitiesToBboxes`.

---

### Bug 9 — UPI ID regex matches all email addresses: false FINANCIAL blocks
**File:** `packages/detection/src/rules/financial/index.ts:24`  
**Status:** ✅ Fixed

UPI pattern `/\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/g` is a superset of email addresses. Every email is detected twice — as `PII.email` and as `FINANCIAL.upi_id`. Since FINANCIAL usually carries a stricter action (BLOCK) than PII (WARN/MASK), every email in a message triggers a false block.

**Fix:** Restrict UPI pattern to known VPA provider suffixes (e.g. `@okaxis`, `@ybl`, `@paytm`, etc.) and tighten the trigger list.

---

### Bug 10 — Credit card pattern misses Amex 4-6-5 format
**File:** `packages/detection/src/rules/financial/index.ts:12`  
**Status:** ✅ Fixed

Pattern `/\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4})\b/g` only captures 4-4-4-1/4 groupings. American Express uses 4-6-5 format (e.g. `3714 496353 98431`). Amex cards are never detected.

**Fix:** Add a separate `financial.amex` rule with pattern `\b3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5}\b` and `validatorId: 'luhn'`.

---

## MEDIUM

### Bug 11 — `clearAttachments` `.group` heuristic too broad: wrong buttons clicked
**File:** `packages/extension/src/content/dom-utils.ts:256`  
**Status:** ✅ Fixed

Level-2 heuristic clicks every small button (`width < 60`) inside any container with `.group` class that contains an image. The Tailwind `.group` class is used ubiquitously on LLM platforms for message rows, sidebar items, and reaction containers. Can accidentally click copy, reaction, edit, share, or other action buttons near images.

**Fix:** Remove `.group` from the `container.closest()` selector. Keep only semantically meaningful selectors: `[class*="attachment"]`, `[class*="file"]`, `[data-testid*="attachment"]`.

---

### Bug 12 — `bypassSet.has(findMainEditor())` may not match `el`: resubmit loops
**File:** `packages/extension/src/content/interceptor.ts:83`  
**Status:** ✅ Fixed

`resubmit(el)` adds `el` to `bypassSet`. When the re-dispatched click fires `handleGlobalClick`, it calls `findMainEditor()` which may return a different element reference from `el` (one resolved from event target traversal, the other from CSS selectors). `bypassSet.has(root)` is `false` and the resubmitted message is intercepted again — infinite loop.

**Fix:** In `handleGlobalClick`, also pass the found element into `handleSubmit` and check `bypassSet.has(btn)` before dispatching, ensuring the same reference is tracked. Also pass `el` directly to `resubmit` so the bypass key is consistent.

---

### Bug 13 — Log queue read-modify-write race: events silently dropped
**File:** `packages/extension/src/background/log-batcher.ts:20`  
**Status:** ✅ Fixed

`queueLog` reads the queue, appends, saves. `flushLogs` also reads, splices, saves remainder. If both run concurrently (interval fires while `queueLog` is mid-flight), the last writer wins and the other's changes are lost. A newly appended log event can be overwritten by `flushLogs` saving a stale queue snapshot.

**Fix:** Serialize all queue mutations through a `flushLock` promise chain so reads and writes are never interleaved.

---

### Bug 14 — `flushLogs()` on service worker suspend is fire-and-forget: logs lost
**File:** `packages/extension/src/background/index.ts:118`  
**Status:** ⚠️ Partially mitigated

The browser does not await promises in `onSuspend`. The service worker is killed before `flushLogs` completes its network request. Any events queued since the last 3-second flush interval are dropped.

**Mitigation:** Reduced `LOG_BATCH_INTERVAL_MS` and added eager flush on each `queueLog` call when queue size crosses a lower threshold. Full fix requires `chrome.alarms` keep-alive, which is out of scope for this pass.

---

### Bug 15 — `setInputValue` `innerText` fallback bypasses React state: original text submitted
**File:** `packages/extension/src/content/interceptor.ts:354`  
**Status:** ✅ Fixed

When `execCommand('insertText')` fails, the fallback `el.innerText = text` sets the DOM directly, bypassing React's controlled component state. The subsequent `dispatchEvent(new Event('input'))` may not propagate through React's synthetic event system in time. Visual text appears masked but the underlying React state still holds the original — which is what gets submitted.

**Fix:** If `execCommand` fails, use a `ClipboardEvent` trick: write the masked text to a `DataTransfer` object and dispatch a synthetic `paste` event with `bypassSet` protection, which React/ProseMirror handles correctly.

---

### Bug 16 — `preventDefault()` on `change` event has no effect
**File:** `packages/extension/src/content/interceptor.ts:553`  
**Status:** ✅ Fixed

The `change` event on `<input type="file">` is not cancelable. `ev.preventDefault()` is a no-op. The actual prevention is already achieved by `target.value = ''` on the next line. The misleading call has been removed.

---

### Bug 17 — `initializePipeline()` not concurrency-safe: tiers initialize multiple times
**File:** `packages/detection/src/pipeline.ts:22`  
**Status:** ✅ Fixed

If `detectPII` is called before the first initialization completes (rapid back-to-back pastes), both callers see `initialized = false` and both run `Promise.all(initPromises)`. Tiers initialize twice in parallel. If the NER model fails on the second attempt (already loading), `initialized` is never set to `true` and every subsequent call retries initialization indefinitely.

**Fix:** Replace the `initialized` boolean with a single shared `initPromise` that all concurrent callers await.

---

### Bug 18 — Policy sync broadcasts to all open tabs, not just LLM tabs
**File:** `packages/extension/src/background/policy-sync.ts:55`  
**Status:** ✅ Fixed

`chrome.tabs.query({})` returns every open tab. `sendMessage` fires for each, with `catch(() => {})` silently swallowing the "no receiver" error for the majority that have no content script. Unnecessary IPC churn, especially with many tabs open. Wakes sleeping background workers unnecessarily.

**Fix:** Query only tabs matching monitored LLM platform URL patterns.

---

### Bug 19 — PDF region mapping uses stale offscreen state after restart
**File:** `packages/extension/src/background/detection-handler.ts:188`  
**Status:** ✅ Fixed

`handleRedactPDF` calls `OFFSCREEN_GET_PDF_REGIONS` which reads `lastPdfPages` — a variable populated only by a prior `OFFSCREEN_RUN_PDF` in the same offscreen document session. If the offscreen document was closed and recreated between the two calls (MV3 lifecycle), `lastPdfPages` is empty and all text-based redaction regions are silently skipped. The call also lacks a `setupOffscreen()` guard.

**Fix:** Call `setupOffscreen()` before sending `OFFSCREEN_GET_PDF_REGIONS`. Return an explicit error if `lastPdfPages` is empty so the caller can surface it rather than silently skipping redaction.

---

---

### Bug 20 — NER `mapLabelToCategory` misclassifies identity docs as FINANCIAL
**File:** `packages/detection/src/tiers/ner/nerTier.ts:267`  
**Status:** ✅ Fixed

`B-IDCARD`, `B-PASSPORT`, `B-SOCIALNUMBER`, `B-DRIVERLICENSE` were all mapped to `'FINANCIAL'` instead of `'PII'`. This caused two problems: (1) if FINANCIAL policy was BLOCK and PII was WARN_ALLOW, an NER-detected passport triggered a full block instead of a warning; (2) if the FINANCIAL category was disabled in policy, NER silently skipped all identity documents even though PII was enabled.

**Fix:** Mapped all identity document labels to `'PII'` where they semantically belong.

---

### Bug 21 — Missing masking tokens for UPI, GST, IFSC, IPv4: all fall through to `[REDACTED]`
**File:** `packages/shared/src/constants/masking-tokens.constants.ts`  
**Status:** ✅ Fixed

`upi_id`, `gst_number`, `ifsc_code`, `ip_address` had no entry in `DETECTION_TYPE_TO_TOKEN`. Masked output for these types was the generic `[REDACTED]` token, making it impossible to tell from a masked message or audit log which type of data was redacted.

**Fix:** Added `UPI_ID`, `GST_NUMBER`, `IFSC_CODE`, `IP_ADDRESS` to both `MASKING_TOKENS` and `DETECTION_TYPE_TO_TOKEN`.

---

### Bug 23 — Policy sync uses polling: up to 30s delay before dashboard changes reach the extension
**Files:** `packages/extension/src/background/policy-sync.ts`, `backend/app/api/v1/extension/policy.py`, `backend/app/api/v1/policy.py`, `backend/app/services/extension_service.py`  
**Status:** ✅ Fixed

Extension polled `GET /extension/policy` every 30s (later reduced to 10s). Any policy change saved in the dashboard took up to that interval to reach the extension. Under heavy tab load the poll also fired against every sync cycle unnecessarily.

**Fix:** Replaced polling with an SSE stream (`GET /extension/policy/stream`). Backend maintains an in-memory per-user subscriber queue; `PUT /policy/current` and `POST /policy` push to all connected queues immediately after commit. Extension connects on startup, applies updates the moment they arrive (~1s latency), and falls back to a 60s poll if the SSE connection drops.

---

### Bug 22 — Policy version check skips same-version updates: dashboard changes never picked up
**File:** `packages/extension/src/background/policy-sync.ts:56`  
**Status:** ✅ Fixed

`syncPolicy` only applied a new policy when `data.version > currentVersion`. If the backend does not increment the version number on each policy save (e.g. always returns `1`), the stored version equals the server version on every poll and the new config is silently discarded. Changing BLOCK → WARN in the dashboard had no effect until the extension was reinstalled.

**Fix:** Changed condition to `>=` so the policy config is always written when the server version matches or exceeds what is stored. This ensures every sync cycle overwrites the local config with the latest from the server.

---

## Summary

| # | Severity | File | Issue | Status |
|---|----------|------|-------|--------|
| 0 | Critical | manifest.json | Content script on all *.google.com pages (Gmail, Docs…) | ✅ Fixed |
| 1 | Critical | interceptor.ts:139 | `isRunning` set after first `await` — concurrent submits race | ✅ Fixed |
| 2 | Critical | content/index.ts:44 | `AUTH_SUCCESS` unhandled — interceptor never starts post-login | ✅ Fixed |
| 3 | Critical | content/index.ts:44 | `onMessage` listener stacks on every `init()` call | ✅ Fixed |
| 4 | Critical | storage.ts:131 | Expired pause never auto-clears — extension stays paused | ✅ Fixed |
| 5 | Critical | detection-handler.ts:220 | PDF redaction uses unauthenticated raw `fetch` to backend | ✅ Fixed |
| 6 | Critical | regexTier.ts:18 | `phone` validator missing — all phone matches pass unvalidated | ✅ Fixed |
| 7 | High | confidential+financial rules | `mod97` / `jwt_parser` / `entropy` validators not implemented | ✅ Fixed |
| 8 | High | offscreen.ts:175 | OCR image path skips NER tier — prose PII missed in images | ✅ Fixed |
| 9 | High | financial/index.ts:24 | UPI regex matches all emails — false FINANCIAL blocks | ✅ Fixed |
| 10 | High | financial/index.ts:12 | Credit card pattern misses Amex 4-6-5 format | ✅ Fixed |
| 11 | Medium | dom-utils.ts:256 | `clearAttachments` `.group` heuristic clicks unintended buttons | ✅ Fixed |
| 12 | Medium | interceptor.ts:83 | `bypassSet` element mismatch in `handleGlobalClick` — resubmit loops | ✅ Fixed |
| 13 | Medium | log-batcher.ts:20 | Log queue race — concurrent read-modify-write drops events | ✅ Fixed |
| 14 | Medium | background/index.ts:118 | `flushLogs` on suspend is fire-and-forget — recent logs lost | ✅ Fixed |
| 15 | Medium | interceptor.ts:354 | `innerText` fallback bypasses React state — original text submitted | ✅ Fixed |
| 16 | Low | interceptor.ts:553 | `preventDefault` on `change` event is a no-op | ✅ Fixed |
| 17 | Medium | pipeline.ts:22 | `initializePipeline` not concurrency-safe — double initialization | ✅ Fixed |
| 18 | Low | policy-sync.ts:55 | Policy broadcast hits all tabs, not just LLM tabs | ✅ Fixed |
| 19 | Medium | detection-handler.ts:188 | PDF region mapping uses stale offscreen state after restart | ✅ Fixed |
| 20 | High | nerTier.ts:267 | Identity docs (passport, ID card, SSN) mapped to FINANCIAL — wrong action applied | ✅ Fixed |
| 21 | Low | masking-tokens.constants.ts | UPI/GST/IFSC/IPv4 mask tokens missing — all fall through to `[REDACTED]` | ✅ Fixed |
| 22 | High | policy-sync.ts:56 | Version `>` check skips same-version updates — dashboard changes never applied | ✅ Fixed |
| 23 | High | policy-sync.ts + backend | Polling-based sync causes up to 30s delay on policy changes | ✅ Fixed (SSE push) |
