# SecureGPT - Regex Tier Classification Framework (Tier 1)

This document defines a production-ready classification system strictly for **regex-based detection**.  
Only **structured, pattern-detectable data** is included.  
Unstructured or NLP-dependent categories are intentionally excluded.

---

# 1. Sensitive Personal Data (SPD)

Structured identifiers linked to individuals.

## 1.1 Government Identifiers (India)
- spd.gov.aadhaar (Verhoeff validated, OCR-tolerant)
- spd.gov.pan_card (Pattern + PAN validation)
- spd.gov.passport_india (Pattern: `[A-Z][0-9]{7,8}`)
- spd.gov.voter_id (Pattern: `[A-Z]{3}[0-9]{7}`)
- spd.gov.driving_license_india (Pattern: `[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}`)
- spd.gov.abha_id (Ayushman Bharat Health Account: `\d{2}-\d{4}-\d{4}-\d{4}`)

## 1.2 Government Identifiers (International)
- spd.gov.us_ssn (Social Security Number: `\d{3}-\d{2}-\d{4}`)
- spd.gov.passport_mrz_l1 (Machine Readable Zone - Line 1)
- spd.gov.passport_mrz_l2 (Machine Readable Zone - Line 2)

## 1.3 Contact Information
- spd.contact.email (RFC 5322 compliant)
- spd.contact.phone_india (Mobile: `+91` or `6-9` start)

## 1.4 Date Identifiers
- spd.personal.date_of_birth (Requires "DOB", "birth", "born" keyword context)

---

# 2. Financial & Transactional Data (FTD)

Structured financial identifiers and payment-related data.

## 2.1 Payment Instruments
- ftd.payment.credit_card (Luhn validated; supports Visa, MC, Amex, Discover)
- ftd.payment.debit_card (Alias for credit card pattern)

## 2.2 Banking Identifiers
- ftd.bank.ifsc_code (Indian Financial System Code: `[A-Z]{4}0[A-Z0-9]{6}`)
- ftd.bank.iban (International Bank Account Number: `[A-Z]{2}\d{2}[A-Z0-9]{11,30}`)
- ftd.bank.swift_bic (Pattern: `[A-Z]{6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3})?`)

## 2.3 Digital Payments
- ftd.payment.upi_id (VPA: `[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}`)

## 2.4 Tax & Regulatory IDs
- ftd.tax.pan_card (Indian Permanent Account Number)
- ftd.tax.gstin (Goods and Services Tax Identification Number)

## 2.5 Cryptocurrency Addresses
- ftd.crypto.btc_address (Legacy & SegWit: `[13][a-km-zA-HJ-NP-Z1-9]{25,34}`)
- ftd.crypto.eth_address (Ethereum hex: `0x[a-fA-F0-9]{40}`)

---

# 3. Authentication & Security Secrets (ASS)

Highly sensitive structured credentials detectable via high-entropy patterns.

## 3.1 Cloud Credentials
- ass.cloud.aws_access_key (Pattern: `AKIA[0-9A-Z]{16}`)
- ass.cloud.aws_secret_key (Context-required: `(?:aws_secret_access_key|secret_key)\s*[=:]\s*(['"]?)([A-Za-z0-9/+]{40})\1`)

## 3.2 API Keys & Tokens
- ass.api.stripe_secret_key (Pattern: `sk_live_[a-zA-Z0-9]{24,}`)
- ass.api.stripe_restricted_key (Pattern: `rk_live_[a-zA-Z0-9]{24,}`)
- ass.api.github_pat (Pattern: `ghp_|gho_|ghr_[A-Za-z0-9]{36}`)
- ass.api.generic_api_key (Context-required: `(?:api[_-]?key|auth[_-]?token|bearer)\s*[=:]\s*(['"]?)([A-Za-z0-9_\-.]{20,})\1`)

## 3.3 Authentication Material
- ass.token.jwt (Pattern: `eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+`)
- ass.crypto.private_key_pem (Header: `-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----`)

---

# 4. Organizational Confidential Data (OCD)

Regex-detectable confidential markers triggered by strict keyword sets.

## 4.1 Legal & Compliance Keywords
- ocd.legal.nda_keywords ("NDA", "Non-Disclosure", "Proprietary")
- ocd.legal.confidentiality_terms ("Strictly Confidential", "Internal Use Only")

## 4.2 Corporate Keywords
- ocd.business.roadmap_keywords ("Q[1-4] Roadmap", "Product Launch 202X")
- ocd.business.ma_keywords ("Merger & Acquisition", "Due Diligence", "LOI")
- ocd.business.patent_keywords ("Patent Pending", "Invention Disclosure")

---

# 5. Technical & Network Identifiers (TNI)

Structured identifiers for systems and network infrastructure.

## 5.1 Network Identifiers
- tni.network.ipv4 (Standard IPv4: `\b((?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b`)
- tni.network.ipv6 (Standard IPv6 patterns)
- tni.network.mac_address (Format: `([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})`)

---

# 6. Detection Constraints (Regex Tier Rules)

### Included
- Fixed-length numeric identifiers.
- Known prefixes/suffixes (e.g., `AKIA`, `sk_live_`).
- Patterns with algorithmic validation (Luhn, Verhoeff, Checksum).
- Strong context-triggered patterns (Entropy > 4.5).

### Excluded (Reserved for Tier 2/3)
- Natural Language Names (Requires NER).
- Free-text Addresses (Requires NER/OCR).
- Medical Conditions/Diagnoses (Requires NLP).
- Generic numbers without surrounding context.

---

# 7. Rule Metadata (Regex Tier)

Each rule object in the engine must include:

- id: Unique identifier (e.g., `spd.contact.phone_india`)
- category: Top-level classification (`SPD`, `FTD`, `ASS`, `OCD`, `TNI`)
- pattern: Regex pattern (Case-sensitive where applicable)
- requireContext: Boolean (If true, must find nearby keywords like "SSN", "Secret")
- validatorId:
  - `luhn` (Credit Cards)
  - `verhoeff` (Aadhaar)
  - `pan` (Indian PAN Card)
  - `checksum` (Generic)
  - `none`
- severity: `critical`, `high`, `medium`, `low`
- action: `redact`, `mask`, `alert`

---

# 8. Example Rule

```json
{
  "id": "ftd.payment.credit_card",
  "category": "FTD",
  "subcategory": "Payment Instruments",
  "pattern": "\\b(\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{1,4})\\b",
  "validatorId": "luhn",
  "severity": "critical",
  "requireContext": false,
  "action": "redact"
}
```
