# SecureGPT — Manual Test Cases

Test cases for every feature, bug fix, and detection rule.  
Run these in a Chrome browser with the extension loaded (unpacked from `packages/extension/dist`).

**Default policy actions (unless a test says otherwise):**
- FINANCIAL → BLOCK
- PII → MASK
- CONFIDENTIAL → BLOCK
- IP → WARN_ALLOW

---

## Section 1 — Platform Scope (Bug 0)

> The extension must only activate on LLM platforms. Not Gmail, not Docs, not Outlook.

### TC-01 — Extension does NOT intercept Gmail compose
1. Open `https://mail.google.com`
2. Click Compose
3. Type your email address in the To field, then type a message body containing `4111 1111 1111 1111`
4. Click Send

**Expected:** Email sends normally. No SecureGPT banner appears. No interception.

---

### TC-02 — Extension does NOT intercept Google Docs
1. Open `https://docs.google.com` and create a new document
2. Type `My SSN is 123-45-6789`
3. Press Enter or any keyboard shortcut

**Expected:** Nothing happens from the extension. Text stays as typed.

---

### TC-03 — Extension does NOT intercept Outlook / Microsoft Teams
1. Open `https://outlook.office.com` or `https://teams.microsoft.com`
2. Compose a message with `AKIA1234567890ABCDEF`
3. Send it

**Expected:** No interception. Message sends normally.

---

### TC-04 — Extension DOES activate on ChatGPT
1. Open `https://chatgpt.com`
2. Type `hello` in the input box and press Enter

**Expected:** If no PII, message sends. The extension banner does NOT appear for clean text. No errors in console.

---

### TC-05 — Extension DOES activate on Gemini
1. Open `https://gemini.google.com`
2. Type `hello` and press Enter

**Expected:** Same as TC-04. Extension is active but silent for clean text.

---

## Section 2 — Auth Flow (Bugs 2, 3)

### TC-06 — Interceptor starts without page refresh after login
1. Open `https://chatgpt.com` **while logged out** of SecureGPT
2. Confirm the interceptor is not running (type `4111 1111 1111 1111`, it should send freely)
3. Click the extension popup and log in via Google
4. After login completes, go back to the ChatGPT tab (do NOT refresh)
5. Type `4111 1111 1111 1111` and press Enter

**Expected:** The block/mask banner appears on step 5 without needing a refresh.  
**Was broken:** Auth success was never broadcast to open tabs.

---

### TC-07 — Listener does not stack after multiple pause/resume cycles
1. Open `https://chatgpt.com` while logged in
2. Open the extension popup → pause for 15 minutes → resume immediately
3. Repeat pause/resume 3 more times (4 total cycles)
4. Type `4111 1111 1111 1111` and press Enter

**Expected:** Exactly one block banner appears. One log event in the dashboard.  
**Was broken:** Each resume called `init()` again, stacking a new onMessage listener each time → multiple banners and logs per submit.

---

## Section 3 — Pause / Resume (Bug 4)

### TC-08 — Extension auto-resumes after pause expires
1. Open `https://chatgpt.com`
2. Click the popup → Pause for 15 minutes
3. Manually set your system clock forward 16 minutes (or use DevTools to mock `Date.now`)  
   _Easier alternative: set pause to 1 minute if the UI allows, then wait 1 minute_
4. Type `4111 1111 1111 1111` and submit

**Expected:** Block banner appears — extension has automatically re-activated.  
**Was broken:** `stateStorage.isActive()` returned `false` forever after a pause because it fell through to `return active` (which was still `false`).

---

### TC-09 — Manual resume works immediately
1. Pause the extension for 1 hour
2. Click Resume in the popup
3. Type `4111 1111 1111 1111` and submit

**Expected:** Block banner appears immediately after Resume.

---

## Section 4 — BLOCK action (FINANCIAL category)

### TC-10 — Credit card Visa/MC blocked
1. Open ChatGPT, set FINANCIAL policy to BLOCK (default)
2. Type: `Please charge my card 4111 1111 1111 1111`
3. Press Enter

**Expected:** 🚫 Red banner — "Submission blocked: Financial Data detected (1 item)". Message does NOT send.

---

### TC-11 — Credit card with hyphens blocked
1. Type: `Card number: 4111-1111-1111-1111`
2. Press Enter

**Expected:** Blocked. Same banner as TC-10.

---

### TC-12 — American Express card blocked (Bug 10 fix)
1. Type: `My Amex is 3714 496353 98431`
2. Press Enter

**Expected:** Blocked. Banner shows Financial Data detected.  
**Was broken:** Amex 4-6-5 format was never detected.

---

### TC-13 — Fake card number (fails Luhn) passes through
1. Type: `My card is 4111 1111 1111 1112` (last digit changed — fails Luhn check)
2. Press Enter

**Expected:** Message sends without any banner.

---

### TC-14 — AWS Access Key blocked
1. Type: `Here is my key: AKIAIOSFODNN7EXAMPLE`
2. Press Enter

**Expected:** Blocked. Banner shows Confidential Business Data detected.

---

### TC-15 — GitHub PAT blocked
1. Type: `Token: ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJ`
2. Press Enter

**Expected:** Blocked.

---

### TC-16 — AWS key in prose without context triggers does NOT fire
1. Type: `The prefix AKID is used in documentation examples sometimes`  
   (not a real key — does not match `AKIA[A-Z0-9]{16}` exactly)
2. Press Enter

**Expected:** Sends normally. (The pattern requires exact `AKIA` + 16 uppercase alphanumeric chars.)

---

## Section 5 — MASK action (PII category)

### TC-17 — Email address is masked before sending
1. Set PII policy to MASK (default)
2. Type: `Please email john.doe@example.com about the project`
3. Press Enter

**Expected:** ⚠️ Orange banner — "Sensitive data detected and masked before sending. 1 item redacted."  
The message that arrives in ChatGPT reads: `Please email [EMAIL-REDACTED] about the project`

---

### TC-18 — Indian Aadhaar number masked (with context)
1. Type: `My aadhaar number is 2345 6789 0123`
2. Press Enter

**Expected:** Masked. Banner shows 1 item redacted.

---

### TC-19 — Aadhaar number WITHOUT context does NOT fire
1. Type: `2345 6789 0123`  
   (no "aadhaar", "uid", "uidai" nearby)
2. Press Enter

**Expected:** Sends normally — context trigger required for this rule.

---

### TC-20 — PAN card masked (no context required)
1. Type: `My PAN is ABCDE1234F`
2. Press Enter

**Expected:** Masked. `ABCDE1234F` becomes `[PAN-REDACTED]` or `[ID-REDACTED]`.

---

### TC-21 — Invalid PAN (fails check digit) passes through
1. Type: `Code ABCDE1234Z`  
   (Z is an invalid 10th character per PAN rules)
2. Press Enter

**Expected:** Sends without masking. (PAN validator rejects it.)

---

### TC-22 — Phone number masked with context keyword
1. Type: `My phone is +91 98765 43210, please call me`
2. Press Enter

**Expected:** Masked. Phone number replaced with `[PHONE-REDACTED]`.  
**Was broken (Bug 6):** Phone matches passed unvalidated — any number sequence could trigger this.

---

### TC-23 — Random number without phone context does NOT fire
1. Type: `The version number is 9876543210`
2. Press Enter

**Expected:** Sends normally — "phone", "mobile", "tel", "call" etc. must be nearby.

---

### TC-24 — US SSN masked with context keyword
1. Type: `My ssn is 123-45-6789`
2. Press Enter

**Expected:** Masked. SSN replaced with `[SSN-REDACTED]`.

---

### TC-25 — Date of birth masked with context
1. Type: `dob: 15/08/1990`
2. Press Enter

**Expected:** Masked. Date replaced with `[DOB-REDACTED]`.

---

## Section 6 — WARN_ALLOW action (IP category)

### TC-26 — M&A keywords trigger warn modal
1. Set IP policy to WARN_ALLOW (default)
2. Type: `We are planning a merger with Acme Corp, due diligence starts Monday`  
   Add context: start the message with "project:"
3. Press Enter

**Expected:** Shield modal appears — user can choose "Mask & Send", "Send Directly", or "Cancel".

---

### TC-27 — Clicking Cancel in warn modal does not send
1. Trigger TC-26
2. Click Cancel in the modal

**Expected:** Message does not send. Input is preserved.

---

### TC-28 — Clicking "Send Directly" in warn modal sends unmasked
1. Trigger TC-26
2. Click Send Directly / Acknowledge & Send

**Expected:** Message sends as-is. Dashboard log shows `WARN_ALLOW` action with `acknowledged: true`.

---

## Section 7 — Multi-category / Priority (most restrictive wins)

### TC-29 — Mixed PII + FINANCIAL: BLOCK wins over MASK
1. Set FINANCIAL=BLOCK, PII=MASK (defaults)
2. Type: `Email john@example.com, card: 4111 1111 1111 1111`
3. Press Enter

**Expected:** Blocked (not masked) — BLOCK has higher priority than MASK.

---

### TC-30 — Multiple PII entities all masked in one pass
1. Type: `Contact me at john@example.com or +91 98765 43210 (mobile)`
2. Press Enter

**Expected:** Both email and phone are replaced in the sent message. Banner shows "2 items redacted".

---

## Section 8 — Image / OCR (Bug 8 fix)

### TC-31 — Pasted image with credit card number is scanned
1. Take a screenshot of a credit card (or a test image with `4111 1111 1111 1111` visible)
2. Copy the image to clipboard
3. Paste into ChatGPT input box

**Expected:** "Scanning image for sensitive context…" loading banner appears briefly, then the image is re-injected with the card number blacked out.

---

### TC-32 — Clean image passes through without modification
1. Copy a clean screenshot (no PII visible)
2. Paste into ChatGPT

**Expected:** Loading banner appears briefly, then the image is re-injected unchanged.

---

### TC-33 — Image with email address in text detected (Bug 8 NER fix)
1. Create an image with typed text: `Please contact admin@company.com for access`
2. Paste it into the chat

**Expected:** Email in the image is detected and blacked out before the image is sent. (Previously only regex ran on OCR text — NER now also runs.)

---

## Section 9 — PDF upload

### TC-34 — PDF with sensitive content is scanned before upload
1. Create a PDF containing `My SSN is 123-45-6789`
2. Upload it via the attachment button on ChatGPT

**Expected:** Loading banner shows. PDF is sent to backend for redaction. Redacted PDF is attached instead of the original.

---

### TC-35 — PDF upload failure does not leak original (Bug 5 fix)
1. Disconnect from internet / stop the backend server
2. Upload a PDF with sensitive content

**Expected:** An error is logged in console (`[Background] Backend Redaction failed`). The original PDF is NOT uploaded. The attach operation is cancelled.  
**Was broken:** The PDF redaction call went directly to `API_BASE_URL` without auth, always 401'd in production.

---

## Section 10 — UPI false positive regression (Bug 9)

### TC-36 — Plain email address does NOT trigger FINANCIAL block
1. Set FINANCIAL=BLOCK
2. Type: `Please email me at john@gmail.com`
3. Press Enter

**Expected:** PII MASK applies (email masked). NOT blocked as financial data.  
**Was broken:** UPI regex matched all emails → triggered FINANCIAL BLOCK for every email.

---

### TC-37 — Actual UPI ID triggers FINANCIAL action (with context)
1. Type: `My UPI vpa is john.doe@okaxis, please transfer`
2. Press Enter

**Expected:** Blocked or masked per FINANCIAL policy. `@okaxis` is a known VPA provider suffix.

---

### TC-38 — Generic `name@company` email NOT detected as UPI
1. Type: `Send an invoice to billing@acmecorp.com`
2. Press Enter

**Expected:** Masked as email (PII). NOT flagged as UPI (FINANCIAL).  
`acmecorp` is not a known VPA provider suffix.

---

## Section 11 — IBAN validation (Bug 7 fix)

### TC-39 — Valid IBAN detected with context
1. Type: `Wire to account GB29NWBK60161331926819, reference invoice 001`
2. Press Enter

**Expected:** Blocked or masked per FINANCIAL policy. IBAN validated via mod-97 checksum.

---

### TC-40 — Invalid IBAN (wrong checksum) does NOT fire
1. Type: `account GB00NWBK60161331926819` (changed checksum digits to 00)
2. Press Enter

**Expected:** Sends normally. mod-97 check fails → match rejected.  
**Was broken:** No validator existed, so any string matching the pattern was flagged.

---

## Section 12 — JWT validation (Bug 7 fix)

### TC-41 — Real JWT blocked with context
1. Type: `Bearer token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
2. Add the word "auth" nearby: `My auth token: eyJ...`
3. Press Enter

**Expected:** Blocked (CONFIDENTIAL). JWT structurally validated — header decodes to JSON with `alg` field.

---

### TC-42 — Fake base64 starting with `eyJ` does NOT fire
1. Type: `token auth: eyJub3RhcmVhbA.bm90cmVhbA` (only 2 parts, not 3)
2. Press Enter

**Expected:** Sends normally — `jwtParserCheck` fails on 2-segment value.  
**Was broken:** Any string starting with `eyJ` was flagged.

---

## Section 13 — Generic API Key entropy check (Bug 7 fix)

### TC-43 — High-entropy secret detected
1. Type: `api_key = "xK9mP2qR7vL4nW8jT1hY5cZ6aB3dE0fG"` (random chars, high entropy)
2. Press Enter

**Expected:** Blocked or masked per CONFIDENTIAL policy.

---

### TC-44 — Low-entropy placeholder does NOT fire
1. Type: `api_key = "your_api_key_here"` (repeated chars, dictionary words)
2. Press Enter

**Expected:** Sends normally — entropy check rejects low-entropy strings.  
**Was broken:** Any string matching `api_key.*['"][A-Za-z0-9]{16,64}['"]` was flagged including README placeholders.

---

## Section 14 — Double submit race condition (Bug 1)

### TC-45 — Rapidly clicking Send twice does not double-submit
1. Open ChatGPT, type `hello` (clean message)
2. Click the Send button twice very rapidly (or press Enter twice fast)

**Expected:** Message sends exactly once. No duplicate messages in the chat.  
**Was broken:** `isRunning` was set after an async await, so two near-simultaneous clicks both passed the guard.

---

### TC-46 — Enter key + Send button simultaneously does not double-submit
1. Type `hello`
2. Press Enter and immediately click the Send button

**Expected:** Message sends once.

---

## Section 15 — React input masking (Bug 15)

### TC-47 — Masked text is actually submitted (not original)
1. Set PII=MASK
2. Type: `My email is test@example.com, help me write a reply`
3. Press Enter

**Expected:** ChatGPT receives `My email is [EMAIL-REDACTED], help me write a reply`.  
Verify by checking what ChatGPT's response refers to — it should acknowledge `[EMAIL-REDACTED]`, not `test@example.com`.  
**Was broken:** `innerText` fallback bypassed React state — visual text was masked but React submitted the original.

---

## Section 16 — clearAttachments safety (Bug 11)

### TC-48 — Sending a masked image does not accidentally click other buttons
1. Paste an image with PII into ChatGPT
2. While the loading banner is showing (OCR scanning), observe that no other buttons (copy, thumbs up, share, etc.) get clicked in existing chat messages

**Expected:** Only the attachment remove button for the current upload is clicked. No side effects on existing messages.  
**Was broken:** The `.group` heuristic in `clearAttachments` was clicking any small button near any image on the entire page.

---

## Section 17 — Policy sync (Bug 18)

### TC-49 — Policy update propagates to open LLM tabs only
1. Open `https://chatgpt.com` and `https://docs.google.com` side by side
2. In the dashboard, change a policy (e.g. FINANCIAL from BLOCK to MASK)
3. Wait up to 30 seconds

**Expected:** The ChatGPT tab picks up the new policy (test by submitting a card number — it should now mask instead of block). The Docs tab is untouched.  
Check the background service worker console — no "no receiver" errors for the Docs tab.

---

## Section 18 — Log batching race (Bug 13)

### TC-50 — Rapid detection events all appear in dashboard logs
1. Submit 5 messages containing PII in quick succession (one every ~200ms — paste + Enter rapidly)
2. Wait 5 seconds for the log batch to flush
3. Check the dashboard Logs/Audit section

**Expected:** All 5 events appear. None silently dropped.  
**Was broken:** Concurrent `queueLog` + `flushLogs` calls raced on the same storage key — last writer wins overwrote the other's changes.

---

## Section 19 — Extension context recovery

### TC-51 — Extension reload recovers gracefully on existing tabs
1. Open ChatGPT
2. Go to `chrome://extensions` and click the reload button for SecureGPT
3. Go back to ChatGPT
4. Type `4111 1111 1111 1111` and submit

**Expected:** A page reload or a console message prompts you to refresh. After refreshing the tab, protection resumes normally.

---

## Section 20 — NER category mapping (Bug 20)

### TC-52 — Passport detected as PII (not FINANCIAL)
> This requires NER to be running (the ONNX model must load successfully)
1. Set FINANCIAL=BLOCK, PII=WARN_ALLOW
2. Type a sentence where the passport number is embedded in prose context: `Traveller passport number P1234567 is booked on the flight`
3. Press Enter

**Expected:** WARN_ALLOW modal appears (PII action). NOT a hard BLOCK.  
**Was broken:** NER mapped passport labels to FINANCIAL → triggered BLOCK instead of the intended WARN_ALLOW.

---

## Section 21 — Masking token labels (Bug 21)

### TC-53 — UPI ID shows descriptive token in masked output
1. Set FINANCIAL=MASK
2. Type: `Transfer to john.doe@okaxis, amount 500 (upi payment)`
3. Press Enter

**Expected:** Message sent reads `Transfer to [UPI-ID-REDACTED], amount 500 (upi payment)`.  
NOT `[REDACTED]`.

---

### TC-54 — GST number shows descriptive token
1. Set FINANCIAL=MASK
2. Type: `Our GSTIN is 27ABCDE1234F1Z5` (with "gst" context nearby)
3. Press Enter

**Expected:** `[GST-REDACTED]` in the sent message.

---

## Section 22 — Stripe / Private Key detection

### TC-55 — Stripe live key blocked
1. Type: `sk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234`
2. Press Enter

**Expected:** Blocked. Stripe pattern has no context requirement (`requireContext: false`).

---

### TC-56 — PEM private key header blocked
1. Type: `-----BEGIN RSA PRIVATE KEY-----`
2. Press Enter

**Expected:** Blocked immediately. No context required.

---

## Quick Regression Checklist

Run these after any code change to confirm nothing broke:

| # | Input | Platform | Expected outcome |
|---|-------|----------|-----------------|
| R-01 | `hello world` | ChatGPT | Sends freely, no banner |
| R-02 | `4111 1111 1111 1111 card` | ChatGPT | 🚫 BLOCK banner |
| R-03 | `john@example.com` | ChatGPT | ⚠️ MASK banner, email replaced in sent text |
| R-04 | `AKIAIOSFODNN7EXAMPLE` | ChatGPT | 🚫 BLOCK banner |
| R-05 | `3714 496353 98431 card` | ChatGPT | 🚫 BLOCK banner (Amex) |
| R-06 | `any text` | Gmail | No banner, sends normally |
| R-07 | `any text` | Google Docs | No banner |
| R-08 | `sk_live_test123456789012345678` | Claude.ai | 🚫 BLOCK banner |
| R-09 | Paste clean PNG | ChatGPT | Loading → clean re-inject |
| R-10 | Pause 15min → resume | ChatGPT | R-02 blocks again after resume |
