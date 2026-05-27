import type { DetectionRule } from '../schema'
import type { PIICategory } from '@securegpt/shared/constants'

export const allFinancialRules: DetectionRule[] = [
  {
    id: 'financial.credit_card',
    category: 'FINANCIAL' as PIICategory,
    type: 'credit_card',
    label: 'Credit Card Number',
    // Visa / MC / Discover — 4-4-4-1/4 grouping
    pattern: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4})\b/g,
    validatorId: 'luhn',
    requireContext: false,
    severity: 'critical',
    enabled: true,
    description: 'Visa, Mastercard, Discover card numbers.'
  },
  {
    id: 'financial.amex',
    category: 'FINANCIAL' as PIICategory,
    type: 'credit_card',
    label: 'American Express Card Number',
    // Bug 10 fix: Amex uses 4-6-5 format, e.g. 3714 496353 98431
    pattern: /\b(3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5})\b/g,
    validatorId: 'luhn',
    requireContext: false,
    severity: 'critical',
    enabled: true,
    description: 'American Express card numbers (4-6-5 format).'
  },
  {
    id: 'financial.upi_id',
    category: 'FINANCIAL' as PIICategory,
    type: 'upi_id',
    label: 'UPI ID',
    // Bug 9 fix: previous pattern matched all emails (superset of RFC 5322).
    // Restricted to known VPA provider handles used by Indian payment systems.
    pattern: /\b[a-zA-Z0-9.\-_]{2,256}@(?:okaxis|ybl|okhdfcbank|okicici|oksbi|paytm|ibl|axl|apl|gpay|upi|allbank|aubs|aubank|barodampay|centralbank|cmsidfc|cnrb|csbpay|dbs|dcb|equitas|fbl|federal|finobank|hdfcbank|icici|idbi|idfc|indus|iob|jkb|jsb|karurvysya|kbl|kotak|kvb|lvb|mahb|nsdl|pnb|psb|rbl|sbi|scb|scbl|syndicate|tjsb|uco|ujvn|union|utbi|vijb|yesbank)\b/gi,
    requireContext: false,
    severity: 'high',
    enabled: true,
    description: 'Unified Payments Interface ID / Virtual Payment Address.'
  },
  {
    id: 'financial.iban',
    category: 'FINANCIAL' as PIICategory,
    type: 'iban',
    label: 'IBAN',
    pattern: /\b[A-Z]{2}[0-9]{2}(?:\s?[0-9a-zA-Z]){11,30}\b/gi,
    validatorId: 'mod97',
    requireContext: false,
    severity: 'high',
    enabled: true,
    description: 'International Bank Account Number.'
  },
  {
    id: 'financial.ifsc_code',
    category: 'FINANCIAL' as PIICategory,
    type: 'ifsc_code',
    label: 'IFSC Code',
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi,
    requireContext: true,
    triggers: ['ifsc', 'branch', 'bank'],
    severity: 'medium',
    enabled: true,
    description: 'Indian Financial System Code for bank branches.'
  },
  {
    id: 'financial.gstin',
    category: 'FINANCIAL' as PIICategory,
    type: 'gst_number',
    label: 'GST Number',
    pattern: /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/gi,
    requireContext: false,
    severity: 'high',
    enabled: true,
    description: 'Indian Goods and Services Tax Identification Number.'
  },
  {
    id: 'financial.pan',
    category: 'FINANCIAL' as PIICategory,
    type: 'pan_card',
    label: 'Indian PAN Card',
    pattern: /\b[A-Z]{5}\s*[0-9OIS]{4}\s*[A-Z]\b/gi,
    validatorId: 'pan',
    requireContext: false,
    severity: 'high',
    enabled: true,
    description: 'Indian Permanent Account Number (PAN) issued by Income Tax Dept.'
  }
]
