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

// Per built-in rule overrides — keyed by rule id (e.g. 'financial.credit_card')
export interface RuleOverride {
  enabled?: boolean
  action?: PolicyAction            // overrides the category-level action for this rule
}

export interface CategoryConfig {
  enabled: boolean
  action: PolicyAction
  customKeywords?: string[]
  allowlist?: string[]
  fuzzyMatch?: boolean
  customRules?: CustomRule[]
  ruleOverrides?: Record<string, RuleOverride>  // key = rule id
}

export interface PIIConfig {
  version: number                 // increments on every policy push from backend
  categories: Record<PIICategory, CategoryConfig>
  monitoredPlatforms: LLMPlatform[]
  customDomains?: string[]        // admin-added extra LLM domains
  allowPause: boolean             // can user pause the extension?
  logUserEmail: boolean           // store email in audit logs?
  sensitivityLevel: 'low' | 'medium' | 'high'
  enableDocumentScanning?: boolean // Admin toggle to inspect uploaded documents/files
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
      action: 'WARN_ALLOW', // Changed from 'MASK' — MASK silently redacts without showing ShieldModal
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
  enableDocumentScanning: true,
  updatedAt: new Date().toISOString(),
}