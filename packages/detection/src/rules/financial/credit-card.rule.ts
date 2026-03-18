// ─────────────────────────────────────────────
// Financial Detection Rules
// ─────────────────────────────────────────────

import type { DetectionRule } from '../schema'

export const financialRules: DetectionRule[] = [
  {
    id: 'financial.credit_card',
    category: 'FINANCIAL',
    type: 'credit_card',
    label: 'Credit / Debit Card',
    // Visa, Mastercard, Amex, Discover — with optional spaces or dashes
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})(?:[-\s]?[0-9]{4}){0,3}\b/g,
    validatorId: 'luhn',
    severity: 'critical',
    enabled: true,
    description: 'Visa, Mastercard, Amex, Discover card numbers',
  },
  {
    id: 'financial.pan_card',
    category: 'FINANCIAL',
    type: 'pan_card',
    label: 'PAN Card (India)',
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,
    validatorId: 'pan',
    severity: 'critical',
    enabled: true,
    description: 'Indian Permanent Account Number (PAN)',
  },
  {
    id: 'financial.gst_number',
    category: 'FINANCIAL',
    type: 'gst_number',
    label: 'GST Number (India)',
    pattern: /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/g,
    severity: 'high',
    enabled: true,
    description: 'Indian GST Identification Number',
  },
  {
    id: 'financial.iban',
    category: 'FINANCIAL',
    type: 'iban',
    label: 'IBAN',
    pattern: /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}(?:[A-Z0-9]?){0,16}\b/g,
    severity: 'critical',
    enabled: true,
    description: 'International Bank Account Number',
  },
  {
    id: 'financial.bank_account_in',
    category: 'FINANCIAL',
    type: 'bank_account',
    label: 'Bank Account Number',
    pattern: /\b[0-9]{9,18}\b/g,
    severity: 'high',
    enabled: true,
    description: 'Indian bank account number (9-18 digits)',
  },
  {
    id: 'financial.ifsc_code',
    category: 'FINANCIAL',
    type: 'ifsc_code',
    label: 'IFSC Code (India)',
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    severity: 'medium',
    enabled: true,
    description: 'Indian Financial System Code',
  },
  {
    id: 'financial.ein',
    category: 'FINANCIAL',
    type: 'ein',
    label: 'EIN (USA)',
    pattern: /\b[0-9]{2}-[0-9]{7}\b/g,
    severity: 'high',
    enabled: true,
    description: 'US Employer Identification Number',
  },
]
