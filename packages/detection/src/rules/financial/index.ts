import type { DetectionRule } from '../schema'
import type { PIICategory } from '@securegpt/shared/constants'

export const allFinancialRules: DetectionRule[] = [
  {
    id: 'financial.credit_card',
    category: 'FINANCIAL' as PIICategory,
    type: 'credit_card',
    label: 'Credit Card Number',
    // Visa / MC / Amex / Discover – with optional spaces or hyphens
    pattern: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4})\b/g,
    validatorId: 'luhn',
    requireContext: true,
    triggers: ['cvv', 'expiry', 'card'],
    severity: 'critical',
    enabled: true,
    description: 'Visa, Mastercard, Amex, Discover card numbers.'
  },
  {
    id: 'financial.upi_id',
    category: 'FINANCIAL' as PIICategory,
    type: 'upi_id',
    label: 'UPI ID',
    pattern: /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/g,
    requireContext: true,
    triggers: ['upi', 'vpa', 'pay'],
    severity: 'high',
    enabled: true,
    description: 'Unified Payments Interface ID / Virtual Payment Address.'
  },
  {
    id: 'financial.iban',
    category: 'FINANCIAL' as PIICategory,
    type: 'iban',
    label: 'IBAN',
    pattern: /\b[A-Z]{2}[0-9]{2}(?:[ ]?[0-9a-zA-Z]{4}){4,7}\b/g,
    validatorId: 'mod97',
    requireContext: true,
    triggers: ['iban', 'account'],
    severity: 'high',
    enabled: true,
    description: 'International Bank Account Number.'
  },
  {
    id: 'financial.ifsc_code',
    category: 'FINANCIAL' as PIICategory,
    type: 'ifsc_code',
    label: 'IFSC Code',
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    requireContext: true,
    triggers: ['ifsc', 'branch', 'bank'],
    severity: 'medium',
    enabled: true,
    description: 'Indian Financial System Code for bank branches.'
  },
  {
    id: 'financial.pan_card',
    category: 'FINANCIAL' as PIICategory,
    type: 'pan_card',
    label: 'Indian PAN Card',
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,
    validatorId: 'pan',
    requireContext: true,
    triggers: ['pan', 'tax id'],
    severity: 'critical',
    enabled: true,
    description: 'Indian Permanent Account Number (PAN).'
  },
  {
    id: 'financial.gstin',
    category: 'FINANCIAL' as PIICategory,
    type: 'gst_number',
    label: 'GST Number',
    pattern: /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/g,
    requireContext: true,
    triggers: ['gst', 'gstin'],
    severity: 'high',
    enabled: true,
    description: 'Indian Goods and Services Tax Identification Number.'
  }
]
