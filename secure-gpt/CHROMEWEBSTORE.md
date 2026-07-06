# Chrome Web Store Listing — SecureGPT — LLM Data Protection

> Last Updated: 2026-07-04

## Store Listing

**Extension Name**
SecureGPT — LLM Data Protection

**Short Description**
Prevent data leaks into AI tools. Detect and mask PII, secrets, and confidential data in ChatGPT, Gemini, Claude, and more.

**Detailed Description**
SecureGPT provides real-time Data Loss Prevention (DLP) for LLM platforms.

Keep your sensitive data secure while using AI. SecureGPT runs client-side analysis to detect, mask, and redact PII, authentication tokens, credentials, and confidential company information before it is sent to AI tools.

Features:
- Real-time client-side scanning and masking of PII, secrets, API keys, and credentials.
- Works across popular LLM platforms including ChatGPT, Gemini, Claude, Copilot, Perplexity, and Meta AI.
- Runs local ONNX Named Entity Recognition (NER) models and OCR (Tesseract.js) inside an offscreen document to ensure zero data latency or unnecessary network exposure.
- Allows user policy configurations and audit logging (enterprise backend sync).

How to Use:
1. Install SecureGPT from the Chrome Web Store.
2. Open your preferred AI platform (e.g., ChatGPT, Claude, Gemini).
3. The extension runs automatically in the background to monitor and mask sensitive content as you type.
4. Access settings and custom regex policies via the extension popup action.

**Category**
Developer Tools / Productivity

**Single Purpose**
Identify, mask, and prevent the leakage of sensitive information (PII, credentials, and confidential data) within a user's browser before it is transmitted to AI services.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | public/icons/icon128.png |
| Screenshot 1 | 1280×800 | ⬜ Not created | |
| Screenshot 2 | 1280×800 | ⬜ Not created | |

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| storage | permissions | Used to persist user settings, local policy configurations, and to temporarily store anonymized metadata for audit logs before they are synced to the enterprise backend. |
| tabs | permissions | Required to detect when a user navigates to or between supported LLM domains (e.g., switching from OpenAI to Claude) to correctly manage extension state and enable/disable protection features. |
| offscreen | permissions | Used to run compute-intensive tasks, specifically the local AI-based Named Entity Recognition (NER) models and OCR (Tesseract.js), in a separate document. This prevents the main service worker or UI thread from becoming unresponsive. |
| alarms | permissions | Used to schedule background synchronization of logs and updates to local policies at set intervals without blocking or draining browser resources. |
| `https://*.openai.com/*` | host_permissions | Allows the extension to monitor, detect, and redact sensitive data on OpenAI's platforms. |
| `https://*.chatgpt.com/*` | host_permissions | Allows the extension to monitor, detect, and redact sensitive data on ChatGPT. |
| `https://gemini.google.com/*` | host_permissions | Allows the extension to monitor, detect, and redact sensitive data on Google Gemini. |
| `https://copilot.microsoft.com/*` | host_permissions | Allows the extension to monitor, detect, and redact sensitive data on Microsoft Copilot. |
| `https://*.claude.ai/*` | host_permissions | Allows the extension to monitor, detect, and redact sensitive data on Claude.ai. |
| `https://*.perplexity.ai/*` | host_permissions | Allows the extension to monitor, detect, and redact sensitive data on Perplexity.ai. |
| `https://*.meta.ai/*` | host_permissions | Allows the extension to monitor, detect, and redact sensitive data on Meta AI. |
| `https://accounts.google.com/*` | host_permissions | Required to authenticate the user and retrieve OAuth 2.0 tokens for login and syncing. |
| `https://securegpt.rkavach.com/*` | host_permissions | Allows communication with the SecureGPT service website. |
| `https://api.securegpt.rkavach.com/*` | host_permissions | Used to sync audit logs and fetch enterprise policy updates from the secure backend API. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | Yes | No | Local processing to mask PII; not stored or sent off-device in raw form. | No |
| Authentication info | Yes | No | Local processing to mask credentials/secrets; not stored or sent off-device in raw form. | No |
| Website content | Yes | No | Local processing to analyze text/images in LLM interfaces; not stored or sent off-device. | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
https://securegpt.rkavach.com/privacy-policy

## Distribution
**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

## Developer Info
**Publisher Name**: rKavach
**Contact Email**: contact@rkavach.com
**Homepage URL**: https://securegpt.rkavach.com

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.1.1 | 2026-07-04 | Added local OCR capabilities via Tesseract.js and improved ONNX models. Updated list of supported LLMs. | Draft |
| 1.1.0 | 2026-05-20 | Initial support for background syncing and storage settings. | Published |
| 1.0.0 | 2026-04-29 | Initial release with basic PII redactor. | Published |
