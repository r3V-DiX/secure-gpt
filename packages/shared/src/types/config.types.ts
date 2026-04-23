// ─────────────────────────────────────────────
// Config / Policy Types
// ─────────────────────────────────────────────

import type { PIICategory, PolicyAction } from '../constants/pii-categories.constants'
import type { LLMPlatform } from '../constants/platforms.constants'

export interface CustomRule {
  id: string                // e.g., "custom.rule_123"
  type: 'custom'
  label: string             // e.g., "Project X Internal Code"
  pattern: string           // Regex string
  caseSensitive?: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  requireContext?: boolean
  triggers?: string[]
  maskingLabel?: string      // e.g., "INTERNAL_ID" -> [INTERNAL_ID-REDACTED]
  enabled: boolean
}

export interface CategoryConfig {
  enabled: boolean
  action: PolicyAction
  customKeywords?: string[]       // org-defined extra keywords for this category
  allowlist?: string[]            // patterns to skip even if matched
  fuzzyMatch?: boolean            // enable fuzzy keyword matching
  customRules?: CustomRule[]      // <--- New field
}

export interface PIIConfig {
  version: number                 // increments on every policy push from backend
  categories: Record<PIICategory, CategoryConfig>
  monitoredPlatforms: LLMPlatform[]
  customDomains?: string[]        // admin-added extra LLM domains
  allowPause: boolean             // can user pause the extension?
  logUserEmail: boolean           // store email in audit logs?
  sensitivityLevel: 'low' | 'medium' | 'high'
  updatedAt: string               // ISO timestamp of last policy sync
}

export const DEFAULT_PII_CONFIG: PIIConfig = {
  version: 1,
  categories: {
    FINANCIAL: {
      enabled: true,
      action: 'BLOCK',
      customKeywords: [],
      allowlist: [],
      fuzzyMatch: false,
      customRules: [],
    },
    PII: {
      enabled: true,
      action: 'MASK',
      customKeywords: [],
      allowlist: [],
      fuzzyMatch: false,
      customRules: [],
    },
    CONFIDENTIAL: {
      enabled: true,
      action: 'BLOCK',
      customKeywords: [],
      allowlist: [],
      fuzzyMatch: false,
      customRules: [],
    },
    IP: {
      enabled: true,
      action: 'WARN_ALLOW',
      customKeywords: [],
      allowlist: [],
      fuzzyMatch: false,
      customRules: [],
    },
  },
  monitoredPlatforms: [
    'chatgpt',
    'gemini',
    'copilot',
    'claude',
    'perplexity',
    'meta-ai',
  ],
  customDomains: [],
  allowPause: true,
  logUserEmail: false,
  sensitivityLevel: 'medium',
  updatedAt: new Date().toISOString(),
}
