// ─────────────────────────────────────────────
// Built-in Rule Catalog
// Static metadata for every built-in detection rule.
// Used by the dashboard to render the per-rule override UI.
// The detection engine has the actual RegExp — this is display-only metadata.
// ─────────────────────────────────────────────

export interface BuiltinRuleMeta {
  id: string
  category: string
  label: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  hasValidator: boolean
  requireContext: boolean
}

export const BUILTIN_RULES_CATALOG: BuiltinRuleMeta[] = [
  // ── FINANCIAL ──────────────────────────────────────────────────────────────
  {
    id: 'financial.credit_card',
    category: 'FINANCIAL',
    label: 'Credit / Debit Card',
    description: 'Visa, Mastercard, and Discover card numbers with Luhn checksum validation',
    severity: 'critical',
    hasValidator: true,
    requireContext: false,
  },
  {
    id: 'financial.amex',
    category: 'FINANCIAL',
    label: 'American Express Card',
    description: 'Amex 4-6-5 format card numbers with Luhn checksum validation',
    severity: 'critical',
    hasValidator: true,
    requireContext: false,
  },
  {
    id: 'financial.upi_id',
    category: 'FINANCIAL',
    label: 'UPI ID (India)',
    description: 'Unified Payments Interface virtual payment addresses (VPA)',
    severity: 'high',
    hasValidator: false,
    requireContext: false,
  },
  {
    id: 'financial.iban',
    category: 'FINANCIAL',
    label: 'IBAN',
    description: 'International Bank Account Numbers with mod-97 checksum validation',
    severity: 'critical',
    hasValidator: true,
    requireContext: false,
  },
  {
    id: 'financial.ifsc_code',
    category: 'FINANCIAL',
    label: 'IFSC Code (India)',
    description: 'Indian Financial System Code for bank branch identification (context-gated)',
    severity: 'medium',
    hasValidator: false,
    requireContext: true,
  },
  {
    id: 'financial.gstin',
    category: 'FINANCIAL',
    label: 'GST Number (India)',
    description: 'Goods and Services Tax Identification Number',
    severity: 'high',
    hasValidator: false,
    requireContext: false,
  },

  // ── PII ────────────────────────────────────────────────────────────────────
  {
    id: 'pii.aadhaar',
    category: 'PII',
    label: 'Aadhaar Number (India)',
    description: '12-digit national identity number with Verhoeff checksum validation',
    severity: 'critical',
    hasValidator: true,
    requireContext: false,
  },
  {
    id: 'pii.us_ssn',
    category: 'PII',
    label: 'US Social Security Number',
    description: 'US SSN in standard format (context-gated: requires "ssn" or "social security")',
    severity: 'critical',
    hasValidator: false,
    requireContext: true,
  },
  {
    id: 'pii.passport_in',
    category: 'PII',
    label: 'Indian Passport Number',
    description: 'Indian passport number (context-gated: requires "passport")',
    severity: 'high',
    hasValidator: false,
    requireContext: true,
  },
  {
    id: 'pii.indian_dl',
    category: 'PII',
    label: 'Indian Driving Licence',
    description: 'Indian driving licence number (context-gated)',
    severity: 'high',
    hasValidator: false,
    requireContext: true,
  },
  {
    id: 'pii.voter_id',
    category: 'PII',
    label: 'Voter ID (India)',
    description: 'Indian Electoral Photo ID Card number (context-gated)',
    severity: 'high',
    hasValidator: false,
    requireContext: true,
  },
  {
    id: 'pii.pan',
    category: 'PII',
    label: 'PAN Card (India)',
    description: 'Permanent Account Number with structural validation',
    severity: 'high',
    hasValidator: true,
    requireContext: false,
  },
  {
    id: 'pii.email',
    category: 'PII',
    label: 'Email Address',
    description: 'Standard email addresses',
    severity: 'medium',
    hasValidator: false,
    requireContext: false,
  },
  {
    id: 'pii.phone_global',
    category: 'PII',
    label: 'Phone Number',
    description: 'Global phone numbers validated via libphonenumber (context-gated)',
    severity: 'medium',
    hasValidator: true,
    requireContext: true,
  },
  {
    id: 'pii.ipv4',
    category: 'PII',
    label: 'IPv4 Address',
    description: 'IPv4 addresses (context-gated: requires "ip", "server", "address")',
    severity: 'low',
    hasValidator: false,
    requireContext: true,
  },
  {
    id: 'pii.abha_id',
    category: 'PII',
    label: 'ABHA Health ID (India)',
    description: 'Ayushman Bharat Health Account ID (context-gated)',
    severity: 'high',
    hasValidator: false,
    requireContext: true,
  },
  {
    id: 'pii.date_of_birth',
    category: 'PII',
    label: 'Date of Birth',
    description: 'Dates in common formats (context-gated: requires "dob", "birth", "born", "age")',
    severity: 'medium',
    hasValidator: false,
    requireContext: true,
  },

  // ── CONFIDENTIAL ───────────────────────────────────────────────────────────
  {
    id: 'confidential.aws_access_key',
    category: 'CONFIDENTIAL',
    label: 'AWS Access Key ID',
    description: 'AWS IAM access keys starting with AKIA/ABIA/ACCA/ASIA',
    severity: 'critical',
    hasValidator: false,
    requireContext: false,
  },
  {
    id: 'confidential.aws_secret_key',
    category: 'CONFIDENTIAL',
    label: 'AWS Secret Access Key',
    description: '40-character AWS secret key with entropy validation',
    severity: 'critical',
    hasValidator: true,
    requireContext: false,
  },
  {
    id: 'confidential.stripe',
    category: 'CONFIDENTIAL',
    label: 'Stripe API Key',
    description: 'Stripe live and test secret keys (sk_live_ / sk_test_)',
    severity: 'critical',
    hasValidator: false,
    requireContext: false,
  },
  {
    id: 'confidential.github_pat',
    category: 'CONFIDENTIAL',
    label: 'GitHub Personal Access Token',
    description: 'GitHub PATs (ghp_, gho_, ghs_, ghr_ prefixes)',
    severity: 'critical',
    hasValidator: false,
    requireContext: false,
  },
  {
    id: 'confidential.jwt_token',
    category: 'CONFIDENTIAL',
    label: 'JWT Token',
    description: 'JSON Web Tokens with structural validation (3-part base64url)',
    severity: 'high',
    hasValidator: true,
    requireContext: false,
  },
  {
    id: 'confidential.generic_api_key',
    category: 'CONFIDENTIAL',
    label: 'Generic API Key / Secret',
    description: 'High-entropy credential strings detected via Shannon entropy analysis',
    severity: 'high',
    hasValidator: true,
    requireContext: false,
  },
  {
    id: 'confidential.private_key',
    category: 'CONFIDENTIAL',
    label: 'Private Key (PEM)',
    description: 'PEM-formatted private keys (RSA, EC, generic)',
    severity: 'critical',
    hasValidator: false,
    requireContext: false,
  },

  // ── IP ─────────────────────────────────────────────────────────────────────
  {
    id: 'ip.roadmap_keywords',
    category: 'IP',
    label: 'Roadmap & Strategy',
    description: 'Product roadmap, quarterly plans, launch timelines (context-gated)',
    severity: 'high',
    hasValidator: false,
    requireContext: true,
  },
  {
    id: 'ip.ma_keywords',
    category: 'IP',
    label: 'M&A / Deal Intelligence',
    description: 'Merger, acquisition, and due-diligence discussions (context-gated)',
    severity: 'critical',
    hasValidator: false,
    requireContext: true,
  },
]

// Fast lookup by rule id
export const BUILTIN_RULES_BY_ID: Record<string, BuiltinRuleMeta> = Object.fromEntries(
  BUILTIN_RULES_CATALOG.map(r => [r.id, r])
)

// Rules grouped by category
export const BUILTIN_RULES_BY_CATEGORY: Record<string, BuiltinRuleMeta[]> = {}
for (const rule of BUILTIN_RULES_CATALOG) {
  if (!BUILTIN_RULES_BY_CATEGORY[rule.category]) {
    BUILTIN_RULES_BY_CATEGORY[rule.category] = []
  }
  BUILTIN_RULES_BY_CATEGORY[rule.category]!.push(rule)
}
