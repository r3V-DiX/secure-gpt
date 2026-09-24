# SecureGPT Test Document Fixtures

Curated document fixtures for manual testing and automated regression suites.

## Format Categories

- **`pdf/`**: Sample bank forms, health reports, redacted documents (`bank_form.pdf`, `health_report.pdf`, `mock_sensitive_data.pdf`, `test_large.pdf`)
- **`docx/`**: Word documents with Aadhaar, PAN, and clean baselines (`block-aadhaar.docx`, `block-pii.docx`, `clean.docx`)
- **`xlsx/`**: Spreadsheets with financial and PII rows (`block-pii.xlsx`, `clean.xlsx`)
- **`pptx/`**: Presentation slides with embedded PII snippets (`block-pii.pptx`)
- **`csv/`**: Tabular text files with IPs, emails, credit cards (`block-pii.csv`, `clean.csv`)
- **`images/`**: Identity card scans and corporate docs (`anshul_pan.png`, `anshul_aadhar.png`, `indianpp.jpg`, `passport.jpg`, `test_financial_doc.png`, `test_medical_doc.png`, `test_technical_doc.png`)
