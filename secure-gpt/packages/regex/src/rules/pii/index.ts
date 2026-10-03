import type { DetectionRule } from '../schema'
import type { PIICategory } from '@securegpt/shared/constants'

export const allPIIRules: DetectionRule[] = [
  {
    id: 'pii.explicit_person_name',
    category: 'PII' as PIICategory,
    type: 'person_name',
    label: 'Person Name',
    pattern: /\b(?:my name is|bill to)\s*:?\s+([A-Z][a-z]{1,30})\s+([A-Z][a-z]{1,30})\b/gi,
    captureGroups: [1, 2],
    severity: 'medium',
    enabled: true,
    description: 'First and last names following explicit identity or billing labels.'
  },
  {
    id: 'pii.aadhaar',
    category: 'PII' as PIICategory,
    type: 'aadhaar',
    label: 'Indian Aadhaar Number',
    pattern: /\b[2-9OISZB][0-9A-Za-z|!•*]{3}[\s-]?[0-9A-Za-z|!•*]{4}[\s-]?[0-9A-Za-z|!•*]{4}\b/gi,
    validatorId: 'verhoeff',
    requireContext: false,
    severity: 'critical',
    enabled: true,
    description: 'Indian Aadhaar (UID) 12-digit number.'
  },
  {
    id: 'pii.masked_aadhaar',
    category: 'PII' as PIICategory,
    type: 'aadhaar',
    label: 'Masked Indian Aadhaar Number',
    pattern: /\b[Xx•*]{4}[\s-]?[Xx•*]{4}[\s-]?[0-9]{4}\b/gi,
    requireContext: false,
    severity: 'critical',
    enabled: true,
    description: 'Masked Indian Aadhaar number (e.g. XXXX XXXX 1234).'
  },
  {
    id: 'pii.aadhaar_vid',
    category: 'PII' as PIICategory,
    type: 'national_id',
    label: 'Aadhaar Virtual ID (VID)',
    pattern: /\bVID\s*:?\s*([0-9]{4}\s*[0-9]{4}\s*[0-9]{4}\s*[0-9]{4})\b/gi,
    requireContext: false,
    severity: 'high',
    enabled: true,
    description: '16-digit Aadhaar Virtual ID.'
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
    pattern: /\b[A-Z][0-9]{7}\b/gi,
    requireContext: true,
    triggers: ['passport', 'pp no', 'passport no', 'republic of india', 'surname', 'given name'],
    severity: 'high',
    enabled: true,
    description: 'Indian Passport Number.'
  },
  {
    id: 'pii.indian_dl',
    category: 'PII' as PIICategory,
    type: 'national_id',
    label: 'Indian Driving Licence',
    pattern: /\b[A-Z]{2}[\s]?[0-9]{2}[\s/-]?(?:[0-9]{4}[\s]?)?[0-9]{7}\b/gi,
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
    pattern: /\b[A-Z]{3}[0-9]{7}\b/gi,
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
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
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
    pattern: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{3,10}/g,
    validatorId: 'phone',
    requireContext: true,
    triggers: ['phone', 'mobile', 'call', 'ph', 'tel', 'contact', 'number', 'num', 'cell', 'mob', 'whatsapp'],
    severity: 'high',
    enabled: true,
    description: 'Global phone number detection validated via libphonenumber.'
  },
  {
    id: 'pii.phone_prefixed',
    category: 'PII' as PIICategory,
    type: 'phone',
    label: 'Prefixed Phone Number',
    pattern: /\+\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{3,10}/g,
    validatorId: 'phone',
    requireContext: false,
    severity: 'high',
    enabled: true,
    description: 'Global phone numbers starting with country code prefix (no context required).'
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
    triggers: ['dob', 'birth', 'born', 'age', 'birthday'],
    severity: 'medium',
    enabled: true,
    description: 'Date patterns triggered when DOB context is nearby.'
  }
]
