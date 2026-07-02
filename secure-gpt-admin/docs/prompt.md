# SecureGPT Test Prompts

Use the following text snippets to manually test the extension's detection capabilities across Regex (Tier 1) and NER (Tier 2). Paste these into ChatGPT, Gemini, or Claude to verify redaction and alerting behavior.

---

## 1. PII & Identity (Regex)

**Indian Aadhaar**
> My Aadhaar number is 7592 2902 8107 and I need to update the address linked to my UIDAI profile.

**US Social Security Number**
> The customer's social security number is 123-45-6789. Please verify the background check.

**Indian Passport**
> I am traveling tomorrow. My passport number is K1234567, can you check the flight status?

**Indian Driving Licence**
> My driving licence (DL no is DL13 2011 0123456) expires next month.

**Indian Voter ID**
> For the upcoming elections, use my EPIC voter id: ABC1234567.

**Email Address**
> You can reach me at john.doe.tester@securegpt-internal.com for further questions.

**Indian Phone Number**
> Call me on +91 9876543210 to discuss the project details.

**IPv4 Address**
> Warning: The production database server IP is 192.168.1.50 and it is currently down.

**Medical (ABHA ID)**
> Patient record health id: 12-3456-7890-1234. Please pull up the medical history.

**Date of Birth**
> To verify my identity, my dob is 01/01/1990.

---

## 2. Financial (Regex)

**Credit Card (Luhn Valid Visa)**
> Process the refund to my card. The cvv is 123 and the number is 4111 1111 1111 1111.

**UPI ID**
> Please transfer the invoice amount to my upi vpa: anshul@okicici.

**IBAN**
> Send the international wire transfer to my IBAN account GB12ABCD345678901234.

**IFSC Code**
> The beneficiary bank IFSC is SBIN0001234 located in Mumbai.

**Indian PAN Card**
> For tax purposes, my PAN card number is ABCPE1234F.

**GSTIN (Indian GST)**
> Our company GSTIN is 27ABCDE1234F1Z5. Please include this on the billing invoice.

---

## 3. Confidential & API Keys (Regex)

**AWS Access Key & Secret**
> Here are the AWS credentials for the staging environment:
> Access Key: AKIAIOSFODNN7EXAMPLE
> aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

**Stripe API Key**
> The payment gateway is using sk_live_51MabcdeFghi1234567890abcdefghijklmn to process transactions.

**GitHub PAT**
> CI/CD pipeline token: ghp_1234567890abcdefghijklmnopqrstuvwxyz

**JWT Token / Bearer**
> Set the Authorization header with this token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U

**Generic API Key**
> database_api_key="aabbccddeeffgghhiijjkkllmmnnoopp"

**Private Key**
> We need to rotate this key today:
> -----BEGIN RSA PRIVATE KEY-----
> MIIEowIBAAKCAQEA...
> -----END RSA PRIVATE KEY-----

---

## 4. Intellectual Property (Regex)

**M&A Keywords**
> The executive board has approved the acquisition of Target Project Alpha. The merger documents are attached.

**Roadmap / Strategy**
> The confidential product roadmap for Q3 2026 includes releasing the new AI masking engine.

---

## 5. Named Entity Recognition (NER / AI Tier)

*Note: These rely strictly on context and the underlying ONNX models since they don't follow rigid regex structures.*

**Person Names**
> I had a meeting with Anshul Sharma and Rajesh Kumar yesterday regarding the new architecture.

**Organizations & Companies**
> We are planning to migrate our infrastructure from Amazon Web Services to Google Cloud next quarter.

**Locations**
> The new corporate headquarters will be located in Bengaluru, Maharashtra, and we are expanding to New York.

---

## 6. Mixed Payload (The Ultimate Test)**

> Hi, my name is Amit Patel from SecureCorp Ltd. Please route the background check invoice to billing@securecorp.com. 
> My primary contact number is +91 9999988888. Our corporate GSTIN is 27ABCDE1234F1Z5 and my personal PAN is ABCPE1234F. 
> For the payment portal integration, use our Stripe key: sk_live_99MabcdeFghi1234567890abcdefghijklmn. 
> Remember that the Project Delta merger is strictly confidential until the Q4 roadmap is finalized.
