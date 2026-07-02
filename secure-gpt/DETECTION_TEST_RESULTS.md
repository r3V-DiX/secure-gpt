# SecureGPT — Detection Test Results

Default policy actions used for all tests:
- FINANCIAL → BLOCK
- PII → MASK
- CONFIDENTIAL → BLOCK
- IP → WARN_ALLOW

Legend: ✅ Expected | ❌ Bug | ⚠️ False Positive | 🔲 Not tested yet

---

## 1. FINANCIAL — Credit Card (Visa/MC/Discover)

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `4111 1111 1111 1111` | BLOCK | BLOCK | ✅ |
| `4111-1111-1111-1111` | BLOCK | BLOCK | ✅ |
| `4111111111111111` (no spaces) | BLOCK | BLOCK | ✅ |
| `4111 1111 1111 1112` (fails Luhn) | PASS | PASS | ✅ |
| `Please charge 4111 1111 1111 1111 to my account` | BLOCK | BLOCK | ✅ |
| `5500 0000 0000 0004` (MC) | BLOCK | BLOCK | ✅ |
| `1234 5678 9012 3456` (random, fails Luhn) | PASS | PASS | ✅ |

**Issues:** None

---

## 2. FINANCIAL — American Express

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `3714 496353 98431` | BLOCK | BLOCK | ✅ |
| `3714-496353-98431` | BLOCK | BLOCK | ✅ |
| `371449635398431` (no spaces) | BLOCK | BLOCK | ✅ |
| `3714 496353 98430` (fails Luhn) | PASS | PASS | ✅ |

**Issues:** None

---

## 3. FINANCIAL — UPI ID

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `john.doe@okaxis` | BLOCK | BLOCK | ✅ |
| `rahul@ybl` | BLOCK | BLOCK | ✅ |
| `user123@paytm` | BLOCK | BLOCK | ✅ |
| `john@gmail.com` | PASS (email only, not UPI) | PASS | ✅ |
| `billing@acmecorp.com` | PASS | PASS | ✅ |
| `JOHN@OKAXIS` (uppercase) | BLOCK | BLOCK | ✅ (case-insensitive fixed) |
| `transfer to john@okaxis please` | BLOCK | BLOCK | ✅ (no context needed now) |

**Issues:** None

---

## 4. FINANCIAL — IBAN

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `GB29NWBK60161331926819` | BLOCK | BLOCK | ✅ |
| `gb29nwbk60161331926819` (lowercase) | BLOCK | BLOCK | ✅ (case-insensitive fixed) |
| `GB00NWBK60161331926819` (bad checksum) | PASS | PASS | ✅ |
| `DE89370400440532013000` | BLOCK | BLOCK | ✅ |
| `Wire to GB29NWBK60161331926819` | BLOCK | BLOCK | ✅ (no context needed now) |

**Issues:** None

---

## 5. FINANCIAL — IFSC Code

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `my bank IFSC is HDFC0001234` | BLOCK | BLOCK | ✅ |
| `branch code SBIN0000001` | BLOCK | BLOCK | ✅ |
| `HDFC0001234` (no context) | PASS | PASS | ✅ (context still required — product codes risk) |
| `hdfc0001234` (lowercase, with context "bank") | BLOCK | BLOCK | ✅ (case-insensitive fixed) |

**Issues:** None

---

## 6. FINANCIAL — GST Number

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `27ABCDE1234F1Z5` | BLOCK | BLOCK | ✅ |
| `27abcde1234f1z5` (lowercase) | BLOCK | BLOCK | ✅ (case-insensitive fixed) |
| `Our GSTIN is 27ABCDE1234F1Z5` | BLOCK | BLOCK | ✅ |
| `27ABCDE1234F1Z5` (no context) | BLOCK | BLOCK | ✅ (context removed — pattern is specific) |
| `12345678901234X` (invalid format) | PASS | PASS | ✅ |

**Issues:** None

---

## 7. PII — Aadhaar

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `4277 2736 2442` (valid Verhoeff) | MASK | MASK | ✅ |
| `427727362442` (no spaces) | MASK | MASK | ✅ (context removed — Verhoeff is strong) |
| `my aadhaar is 4277 2736 2442` | MASK | MASK | ✅ |
| `1234 5678 9012` (starts with 1 — invalid) | PASS | PASS | ✅ (pattern requires first digit 2-9) |
| `4277 2736 2441` (fails Verhoeff) | PASS | PASS | ✅ |

**Issues:** None

---

## 8. PII — PAN Card

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `ABCDE1234F` | MASK | MASK | ✅ |
| `abcde1234f` (lowercase) | MASK | MASK | ✅ (case-insensitive fixed) |
| `BLBPH3501A` | MASK | MASK | ✅ (original reported bug — fixed) |
| `blbph3501a` (lowercase) | MASK | MASK | ✅ |
| `my pan is ABCDE1234F` | MASK | MASK | ✅ |
| `ABCDE1234Z` (Z is invalid 4th-char entity type) | PASS | PASS | ✅ |
| `ABCDE12345` (digit at end instead of letter) | PASS | PASS | ✅ |

**Issues:** None

---

## 9. PII — Email

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `john.doe@example.com` | MASK | MASK | ✅ |
| `Please email john@gmail.com about this` | MASK | MASK | ✅ |
| `admin@company.co.in` | MASK | MASK | ✅ |
| `notanemail@` | PASS | PASS | ✅ |
| `john@gmail.com` should NOT trigger UPI BLOCK | MASK only | MASK only | ✅ |

**Issues:** None

---

## 10. PII — Phone Number

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `my phone is +91 98765 43210` | MASK | MASK | ✅ |
| `call me on 9876543210 mobile` | MASK | MASK | ✅ |
| `9876543210` (no context) | PASS | PASS | ✅ (context required — too generic) |
| `version 9876543210` | PASS | PASS | ✅ |
| `tel: 9876543210` | MASK | MASK | ✅ |
| `+1 800 555 0100 contact` | MASK | MASK | ✅ |

**Issues:** None

---

## 11. PII — US SSN

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `my ssn is 123-45-6789` | MASK | MASK | ✅ |
| `social security 123-45-6789` | MASK | MASK | ✅ |
| `123-45-6789` (no context) | PASS | PASS | ✅ (context required — looks like ref numbers) |
| `000-45-6789` (invalid — 000 prefix) | PASS | PASS | ✅ |
| `666-45-6789` (invalid — 666 prefix) | PASS | PASS | ✅ |

**Issues:** None

---

## 12. PII — Indian Passport

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `passport A1234567` | MASK | MASK | ✅ |
| `pp no B9876543` | MASK | MASK | ✅ |
| `A1234567` (no context) | PASS | PASS | ✅ (context required — too generic) |
| `a1234567` (lowercase, with passport context) | MASK | MASK | ✅ (case-insensitive fixed) |

**Issues:** None

---

## 13. PII — Indian Driving Licence

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `dl no MH12 2019 1234567` | MASK | MASK | ✅ |
| `driving licence DL012019123456` | MASK | MASK | ✅ |
| `MH122019123456` (no context) | PASS | PASS | ✅ (context required) |

**Issues:** None

---

## 14. PII — Voter ID

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `voter id ABC1234567` | MASK | MASK | ✅ |
| `epic number XYZ9876543` | MASK | MASK | ✅ |
| `ABC1234567` (no context) | PASS | PASS | ✅ (context required — 3-letter codes are everywhere) |

**Issues:** None

---

## 15. PII — Date of Birth

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `dob: 15/08/1990` | MASK | MASK | ✅ |
| `born on 15/08/1990` | MASK | MASK | ✅ |
| `birthday 15/08/1990` | MASK | MASK | ✅ (added trigger) |
| `age verification: 15/08/1990` | MASK | MASK | ✅ (added trigger) |
| `15/08/1990` (bare date, no context) | PASS | PASS | ✅ (reverted to context-required) |
| `invoice date 15/08/1990` | PASS | PASS | ✅ ("invoice", "date" not in triggers) |
| `meeting on 15/08/1990` | PASS | PASS | ✅ |
| `15/13/1990` (invalid month 13) | PASS | PASS | ✅ (pattern enforces 01-12) |

**Issues:** None

---

## 16. PII — IPv4

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `server ip 192.168.1.1` | WARN | WARN | ✅ |
| `address 10.0.0.1` | WARN | WARN | ✅ |
| `192.168.1.1` (no context) | PASS | PASS | ✅ (context required — too common in tech text) |
| `256.0.0.1` (invalid) | PASS | PASS | ✅ (pattern enforces 0-255) |

**Issues:** None

---

## 17. PII — ABHA ID

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `abha id 12-3456-7890-1234` | MASK | MASK | ✅ |
| `health id 12-3456-7890-1234` | MASK | MASK | ✅ |
| `12-3456-7890-1234` (no context) | PASS | PASS | ✅ (looks like order/invoice numbers) |

**Issues:** None

---

## 18. CONFIDENTIAL — AWS Access Key

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `AKIAIOSFODNN7EXAMPLE` | BLOCK | BLOCK | ✅ |
| `akiaiosfodnn7example` (lowercase) | BLOCK | BLOCK | ✅ (case-insensitive fixed) |
| `My key is AKIAIOSFODNN7EXAMPLE` | BLOCK | BLOCK | ✅ |
| `AKID is just a prefix in docs` | PASS | PASS | ✅ (must be exactly AKIA/ABIA/ACCA/ASIA + 16 chars) |

**Issues:** None

---

## 19. CONFIDENTIAL — AWS Secret Key

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"` | BLOCK | BLOCK | ✅ |
| `aws_secret_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"` | BLOCK | BLOCK | ✅ |
| `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | BLOCK | BLOCK | ✅ (no context needed now) |

**Issues:** None

---

## 20. CONFIDENTIAL — Stripe Key

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `sk_live_aBcDeFgHiJkLmNoPqRsTuVwXy` | BLOCK | BLOCK | ✅ |
| `SK_LIVE_aBcDeFgHiJkLmNoPqRsTuVwXy` (uppercase) | BLOCK | BLOCK | ✅ (case-insensitive fixed) |
| `sk_test_aBcDeFgHiJkLmNoPqRsTuVwXy` | BLOCK | BLOCK | ✅ |
| `rk_live_aBcDeFgHiJkLmNoPqRsTuVwXy` | BLOCK | BLOCK | ✅ |
| `sk_live_short` (< 24 chars suffix) | PASS | PASS | ✅ |

**Issues:** None

---

## 21. CONFIDENTIAL — GitHub PAT

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJ` | BLOCK | BLOCK | ✅ |
| `GHP_aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJ` (uppercase) | BLOCK | BLOCK | ✅ (case-insensitive fixed) |
| `gho_aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJ` | BLOCK | BLOCK | ✅ |
| `ghp_tooshort` | PASS | PASS | ✅ (must be exactly 36 chars after prefix) |

**Issues:** None

---

## 22. CONFIDENTIAL — JWT Token

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c` | BLOCK | BLOCK | ✅ |
| `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c` | BLOCK | BLOCK | ✅ |
| `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c` (no "token"/"auth" nearby) | BLOCK | BLOCK | ✅ (context removed — eyJ is specific) |
| `eyJub3RhcmVhbA.bm90cmVhbA` (only 2 parts) | PASS | PASS | ✅ (JWT validator rejects) |
| `eyJhbGciOiJub3RqanNvbiJ9` (header not valid JSON) | PASS | PASS | ✅ (JWT validator rejects) |

**Issues:** None

---

## 23. CONFIDENTIAL — Generic API Key (with prefix)

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `api_key = "xK9mP2qR7vL4nW8jT1hY5cZ6aB3dE0fG"` | BLOCK | BLOCK | ✅ |
| `token: "xK9mP2qR7vL4nW8jT1hY5cZ6aB3dE0fG"` | BLOCK | BLOCK | ✅ |
| `api_key = "your_api_key_here"` (low entropy) | PASS | PASS | ✅ |
| `password = "abc123"` (too short + low entropy) | PASS | PASS | ✅ |

**Issues:** None

---

## 24. CONFIDENTIAL — Bare High-Entropy Secret

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `xK9mP2qR7vL4nW8jT1hY5cZ6aB3dE0fG` (32 chars, high entropy) | BLOCK | BLOCK | ❌ **ISSUE: likely false positives** |
| `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` (low entropy — repeated) | PASS | PASS | ✅ |
| `yourapikeyherepleaseenterithere12` (dictionary words) | PASS | PASS | ✅ |
| A regular 32-char UUID like `550e8400e29b41d4a716446655440000` | BLOCK | BLOCK | ⚠️ **FALSE POSITIVE — UUIDs are not secrets** |
| A 32-char product SKU like `ABCDEF1234567890ABCDEF1234567890` | BLOCK | BLOCK | ⚠️ **FALSE POSITIVE — high entropy but not a secret** |
| A base64-encoded image chunk | BLOCK | BLOCK | ⚠️ **FALSE POSITIVE — base64 content has high entropy** |

**Issues:**
- ❌ `confidential.bare_secret` rule is too aggressive — any 32+ char high-entropy string fires, including UUIDs, SKUs, hashes, base64 data. Needs to be removed or heavily constrained.

---

## 25. CONFIDENTIAL — Private Key

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `-----BEGIN RSA PRIVATE KEY-----` | BLOCK | BLOCK | ✅ |
| `-----BEGIN EC PRIVATE KEY-----` | BLOCK | BLOCK | ✅ |
| `-----BEGIN PRIVATE KEY-----` | BLOCK | BLOCK | ✅ |
| `-----begin rsa private key-----` (lowercase) | BLOCK | BLOCK | ✅ (case-insensitive fixed) |
| `-----BEGIN PUBLIC KEY-----` | PASS | PASS | ✅ (not PRIVATE) |

**Issues:** None

---

## 26. IP — M&A Keywords

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `We are planning a merger with Acme Corp` | WARN | WARN | ✅ |
| `acquisition of the startup is complete` | WARN | WARN | ✅ |
| `due diligence process starts Monday` | WARN | WARN | ✅ |
| `the merger sort algorithm is fast` | WARN | WARN | ⚠️ **FALSE POSITIVE — "merger" in tech/algo context** |
| `we need to acquire new users` | PASS | PASS | ✅ ("acquire" not "acquisition") |

**Issues:**
- ⚠️ `ip.ma_keywords` fires on "merger" in any context now that context is removed. "merge sort", "merger of arrays" in a CS question would trigger a WARN modal. Might be acceptable for a security product, but worth noting.

---

## 27. IP — Roadmap & Strategy

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `confidential: our roadmap for Q3 2025` | WARN | WARN | ✅ |
| `internal draft — launch plan for Q2 2026` | WARN | WARN | ✅ |
| `our roadmap` (no context like "confidential"/"internal") | PASS | PASS | ✅ (context still required) |
| `the product roadmap is public` | PASS | PASS | ✅ |

**Issues:** None

---

## Summary of Issues Found

| # | Rule | Issue | Severity |
|---|------|-------|----------|
| 1 | `confidential.bare_secret` | Too aggressive — UUIDs, SKUs, base64 chunks all have high entropy and will false-positive | HIGH — ✅ Fixed (rule removed) |
| 2 | `ip.ma_keywords` | "merger" without context fires on CS/tech uses ("merge sort algorithm", "array merger") | LOW — ✅ Fixed (context restored with broader triggers) |

---

## Recommended Fixes

### Fix 1 — Remove `confidential.bare_secret` rule
The pattern `/\b[a-zA-Z0-9+/\-_]{32,64}\b/g` with entropy check still catches too much. UUIDs (`550e8400-e29b-41d4...`), base64 image chunks, hex hashes, and product SKUs all pass the entropy check. The `generic_api_key` rule already covers keys with surrounding keyword context. The specific rules (AWS, GitHub, Stripe, JWT) cover the most important bare secrets. Remove this rule entirely.

### Fix 2 — Restore context for `ip.ma_keywords` OR tighten the pattern
Option A: Add back `requireContext: true` with broader triggers like `['project', 'target', 'deal', 'company', 'corp', 'acquire']`
Option B: Keep context-free but add word boundaries and exclude common dev terms.
Recommendation: Option A — the false positive on "merge sort" in a CS question is annoying enough to warrant it.
