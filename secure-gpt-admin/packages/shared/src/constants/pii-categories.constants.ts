// ─────────────────────────────────────────────
// PII Categories + Policy Actions
// ─────────────────────────────────────────────

export const BUILTIN_PII_CATEGORIES = {
  FINANCIAL: 'FINANCIAL',
  PII: 'PII',
  CONFIDENTIAL: 'CONFIDENTIAL',
  IP: 'IP',
} as const

export const PII_CATEGORIES = BUILTIN_PII_CATEGORIES

export type PIICategory = string

export const PII_CATEGORY_LABELS: Record<PIICategory, string> = {
  FINANCIAL: 'Financial Data',
  PII: 'Personal Data (PII)',
  CONFIDENTIAL: 'Confidential Business Data',
  IP: 'Intellectual Property',
}

export const PII_CATEGORY_DESCRIPTIONS: Record<PIICategory, string> = {
  FINANCIAL: 'Credit cards, bank accounts, tax IDs, salary data, financial statements',
  PII: 'Names, emails, phone numbers, national IDs, addresses, medical info',
  CONFIDENTIAL: 'Source code, API keys, passwords, internal documents, M&A data',
  IP: 'Product roadmaps, patent info, trade secrets, proprietary algorithms',
}

export const PII_CATEGORY_EXAMPLES: Record<PIICategory, string[]> = {
  FINANCIAL: ['Credit card numbers', 'IBAN / bank account', 'PAN / TIN / GST'],
  PII: ['Email addresses', 'Aadhaar / SSN / Passport', 'Phone numbers'],
  CONFIDENTIAL: ['AWS / GitHub API keys', 'Passwords & secrets', 'Source code'],
  IP: ['Product roadmap', 'Patent applications', 'Trade secrets'],
}

// ─────────────────────────────────────────────
// Policy Actions
// ─────────────────────────────────────────────

export const POLICY_ACTIONS = {
  BLOCK: 'BLOCK',
  MASK: 'MASK',
  WARN_ALLOW: 'WARN_ALLOW',
  ALLOW: 'ALLOW',
} as const

export type PolicyAction = keyof typeof POLICY_ACTIONS

export const POLICY_ACTION_LABELS: Record<PolicyAction, string> = {
  BLOCK: 'Block',
  MASK: 'Mask & Send',
  WARN_ALLOW: 'Warn + Allow',
  ALLOW: 'Allow (Audit)',
}

export const POLICY_ACTION_DESCRIPTIONS: Record<PolicyAction, string> = {
  BLOCK: 'Submission is completely prevented. User cannot proceed.',
  MASK: 'Sensitive tokens replaced with placeholders before sending.',
  WARN_ALLOW: 'User is warned but can acknowledge and proceed.',
  ALLOW: 'Content passes through. Logged silently for audit.',
}

export const POLICY_ACTION_COLORS: Record<PolicyAction, string> = {
  BLOCK: '#D32F2F',
  MASK: '#F57C00',
  WARN_ALLOW: '#E65100',
  ALLOW: '#1565C0',
}

// Default actions per category (PRD defaults)
export const DEFAULT_CATEGORY_ACTIONS: Record<PIICategory, PolicyAction> = {
  FINANCIAL: 'BLOCK',
  PII: 'MASK',
  CONFIDENTIAL: 'BLOCK',
  IP: 'WARN_ALLOW',
}
