// src/features/policy/services/policy.service.ts
import { apiGet, apiPut } from '@/lib/api/client'
import type { Policy, PIIConfig } from '@/types'

export async function fetchCurrentPolicy(): Promise<Policy> {
  return apiGet<Policy>('/policy/current')
}

export async function savePolicy(config: PIIConfig, publishImmediately = true): Promise<Policy> {
  return apiPut<Policy>('/policy/current', { config, publishImmediately })
}

export const DEFAULT_POLICY_CONFIG: PIIConfig = {
  version: 1,
  categories: {
    FINANCIAL: { enabled: true, action: 'BLOCK', customKeywords: [], allowlist: [], fuzzyMatch: false },
    PII: { enabled: true, action: 'MASK', customKeywords: [], allowlist: [], fuzzyMatch: false },
    CONFIDENTIAL: { enabled: true, action: 'BLOCK', customKeywords: [], allowlist: [], fuzzyMatch: false },
    IP: { enabled: true, action: 'WARN_ALLOW', customKeywords: [], allowlist: [], fuzzyMatch: false },
  },
  monitoredPlatforms: ['chatgpt', 'gemini', 'copilot', 'claude', 'perplexity', 'meta-ai'],
  customDomains: [],
  allowPause: true,
  logUserEmail: false,
  sensitivityLevel: 'medium',
}