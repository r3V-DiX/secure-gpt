import type { DetectionRule } from '../schema'
import type { PIICategory } from '@securegpt/shared/constants'

export const allPIIRules: DetectionRule[] = [
  {
    id: 'pii.aadhaar',
    category: 'PII' as PIICategory,
    type: 'aadhaar',
    label: 'Indian Aadhaar Number',
    pattern: /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/g,
    validatorId: 'verhoeff',
    requireContext: true,
    triggers: ['aadhaar', 'uidai', 'uid', 'aadhar'],
    severity: 'critical',
    enabled: true,
    description: 'Indian Aadhaar (UID) 12-digit number.'
  },
  {
    id: 'pii.us_ssn',
    category: 'PII' as PIICategory,
    type: 'ssn',
    label: 'US Social Security Number',
    pattern: /\b(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}\b/g,
    requireContext: true,
    triggers: ['ssn', 'social security'],
    severity: 'high',
    enabled: true,
    description: 'US Social Security Number in 3-2-4 format.'
  },
  {
    id: 'pii.passport_in',
    category: 'PII' as PIICategory,
    type: 'passport',
    label: 'Indian Passport Number',
    pattern: /\b[A-PR-WY][1-9]\d\s?\d{4}[1-9]\b/g,
    requireContext: true,
    triggers: ['passport', 'pp no'],
    severity: 'high',
    enabled: true,
    description: 'Indian Passport Number.'
  },
  {
    id: 'pii.indian_dl',
    category: 'PII' as PIICategory,
    type: 'national_id',
    label: 'Indian Driving Licence',
    // State code (2) + RTO (2) + optional space/sep + year (4) + optional space + seq (7)
    pattern: /\b[A-Z]{2}[\s]?[0-9]{2}[\s/-]?(?:[0-9]{4}[\s]?)?[0-9]{7}\b/g,
    requireContext: true,
    triggers: ['driving licence', 'dl no', 'dl', 'license'],
    severity: 'medium',
    enabled: true,
    description: 'Indian Driving Licence.'
  },
  {
    id: 'pii.voter_id',
    category: 'PII' as PIICategory,
    type: 'national_id',
    label: 'Indian Voter ID',
    pattern: /\b[A-Z]{3}[0-9]{7}\b/g,
    requireContext: true,
    triggers: ['epic', 'voter id', 'election card'],
    severity: 'medium',
    enabled: true,
    description: 'Indian Election Commission Voter ID (EPIC Number).'
  },
  {
    id: 'pii.email',
    category: 'PII' as PIICategory,
    type: 'email',
    label: 'Email Address',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    requireContext: false,
    severity: 'high',
    enabled: true,
    description: 'RFC 5322 compliant email address pattern.'
  },
  {
    id: 'pii.phone_global',
    category: 'PII' as PIICategory,
    type: 'phone',
    label: 'Phone Number',
    // Broad Net: catch anything that looks remotely like a phone number, validate later
    pattern: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{3,10}/g,
    validatorId: 'phone',
    requireContext: true,
    triggers: ['phone', 'mobile', 'call', 'ph', 'tel', 'contact'],
    severity: 'high',
    enabled: true,
    description: 'Global phone number detection validated via libphonenumber.'
  },
  {
    id: 'pii.ipv4',
    category: 'PII' as PIICategory,
    type: 'ip_address',
    label: 'IPv4 Address',
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    requireContext: true,
    triggers: ['ip', 'address', 'server'],
    severity: 'low',
    enabled: true,
    description: 'IPv4 network addresses.'
  },
  {
    id: 'pii.abha_id',
    category: 'PII' as PIICategory,
    type: 'medical',
    label: 'ABHA ID',
    pattern: /\b[0-9]{2}-[0-9]{4}-[0-9]{4}-[0-9]{4}\b/g,
    requireContext: true,
    triggers: ['abha', 'health id', 'ndhm'],
    severity: 'critical',
    enabled: true,
    description: 'Ayushman Bharat Health Account (ABHA) ID.'
  },
  {
    id: 'pii.date_of_birth',
    category: 'PII' as PIICategory,
    type: 'date_of_birth',
    label: 'Date of Birth',
    pattern: /\b(?:0[1-9]|[12][0-9]|3[01])[-/.](?:0[1-9]|1[012])[-/.](?:19|20)\d\d\b/g,
    requireContext: true,
    triggers: ['dob', 'birth', 'born'],
    severity: 'medium',
    enabled: true,
    description: 'Date patterns triggered when DOB context is nearby.'
  }
]
