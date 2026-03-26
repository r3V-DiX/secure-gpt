// ─────────────────────────────────────────────
// Financial Detection Rules
// Enhanced with MVP patterns
// ─────────────────────────────────────────────

import type { DetectionRule } from '../schema'

export const financialRules: DetectionRule[] = [
  {
    id: 'financial.credit_card',
    category: 'FINANCIAL',
    type: 'credit_card',
    label: 'Credit / Debit Card Number',
    // Visa / MC / Amex / Discover – with optional spaces or hyphens
    pattern: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4})\b/g,
    validatorId: 'luhn',
    severity: 'critical',
    enabled: true,
    description: 'Visa, Mastercard, Amex, Discover card numbers with Luhn check',
  },
  {
    id: 'financial.pan_card',
    category: 'FINANCIAL',
    type: 'pan_card',
    label: 'Indian PAN Card Number',
    // Format: 5 letters, 4 digits, 1 letter. 4th char: [PCHFATBLJG]
    // Allowing common OCR misreads (O=0, I=1, S=5) in numeric part
    pattern: /\b([A-Z]{3}[PCHFATBLJG][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi,
    validatorId: 'pan',
    severity: 'critical',
    enabled: true,
    description: 'Indian Permanent Account Number (PAN)',
  },
  {
    id: 'financial.gstin',
    category: 'FINANCIAL',
    type: 'gst_number',
    label: 'Indian GSTIN Number',
    pattern: /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/gi,
    severity: 'high',
    enabled: true,
    description: 'Indian GST Identification Number',
  },
  {
    id: 'financial.upi_id',
    category: 'FINANCIAL',
    type: 'upi_id',
    label: 'UPI ID / VPA',
    pattern: /\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b/g,
    requireContext: true,
    severity: 'medium',
    enabled: true,
    description: 'Unified Payments Interface ID',
  },
  {
    id: 'financial.iban',
    category: 'FINANCIAL',
    type: 'iban',
    label: 'IBAN Number',
    pattern: /\b([A-Z]{2}\d{2}[A-Z0-9]{11,30})\b/g,
    requireContext: true,
    severity: 'critical',
    enabled: true,
    description: 'International Bank Account Number',
  },
  {
    id: 'financial.ifsc_code',
    category: 'FINANCIAL',
    type: 'ifsc_code',
    label: 'IFSC Bank Code',
    pattern: /\b([A-Z]{4}0[A-Z0-9]{6})\b/g,
    requireContext: true,
    severity: 'medium',
    enabled: true,
    description: 'Indian Financial System Code',
  },
  {
    id: 'financial.btc_address',
    category: 'FINANCIAL',
    type: 'financial_data',
    label: 'Bitcoin Address',
    pattern: /\b([13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g,
    severity: 'high',
    enabled: true,
    description: 'Bitcoin Legacy or SegWit address',
  },
  {
    id: 'financial.eth_address',
    category: 'FINANCIAL',
    type: 'financial_data',
    label: 'Ethereum Address',
    pattern: /\b(0x[a-fA-F0-9]{40})\b/g,
    severity: 'high',
    enabled: true,
    description: 'Ethereum hex address',
  },
]
