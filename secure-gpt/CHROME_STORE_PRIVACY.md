# Chrome Web Store Privacy Disclosures: SecureGPT

## Single Purpose Description
SecureGPT provides real-time Data Loss Prevention (DLP) for LLM platforms. Its single purpose is to identify, mask, and prevent the leakage of sensitive information (PII, credentials, and confidential data) within a user's browser before it is transmitted to AI services like ChatGPT, Gemini, and Claude.

---

## Permission Justifications

### storage
Used to persist user settings, local policy configurations (e.g., specific regex patterns to block), and to temporarily store anonymized metadata for audit logs before they are synced to the enterprise backend.

### activeTab
Allows the extension to access and analyze the LLM interface only when the user is actively interacting with a supported AI platform, ensuring that data detection logic only runs when relevant to the user's workflow.

### scripting
Necessary to inject content scripts into LLM websites to intercept DOM changes and network requests. This allows the extension to detect sensitive data in real-time as the user types or receives responses.

### offscreen
Used to run compute-intensive tasks, specifically the AI-based Named Entity Recognition (NER) models and OCR (Tesseract.js), in a separate document. This prevents the main background worker or UI thread from becoming unresponsive during heavy data analysis.

### tabs
Required to detect when a user navigates to or between supported LLM domains (e.g., switching from OpenAI to Claude). This ensures the extension can correctly manage its state and enable/disable protection features based on the active site.

### Host Permission Justification
Required for the domains specified in the manifest (e.g., `openai.com`, `claude.ai`, `google.com`) to allow the extension to monitor and redact data on these specific LLM platforms. Without these permissions, the extension cannot intercept the data sent to these AI services.

---

## Remote Code Execution
**Are you using remote code?**
*Recommendation:* **No**. 
*Justification:* All logic, including the NER models (ONNX) and OCR engines (Wasm), are bundled locally within the extension package. No external JavaScript or Wasm is fetched or executed at runtime, adhering to Manifest V3 security requirements.

*(Note: If you selected "Yes" in the screenshot because you are loading model weights from a CDN, ensure those are treated as data, not code. However, for a smoother review, bundling is preferred.)*

---

## Data Usage Disclosures

**What user data do you plan to collect?**

*   **[Checked] Personally identifiable information**: The extension processes PII (names, emails, etc.) to mask them. While raw PII is not stored on our servers, it is "processed" by the extension.
*   **[Checked] Authentication information**: The extension detects and masks credentials or secrets found in prompts.
*   **[Checked] Website content**: The extension analyzes the text and images within LLM chat interfaces to provide its core redaction service.

**Certifications:**
*   **[Checked]** I do not sell or transfer user data to third parties, apart from the approved use cases.
*   **[Checked]** I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
*   **[Checked]** I do not use or transfer user data to determine creditworthiness or for lending purposes.

---

## Privacy Policy URL
*Placeholder: https://your-domain.com/privacy-policy*
