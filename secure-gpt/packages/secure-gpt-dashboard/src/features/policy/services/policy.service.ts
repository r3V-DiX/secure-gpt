// src/features/policy/services/policy.service.ts
import { apiGet, apiPut } from '@/lib/api/client'
import type { Policy, PIIConfig } from '@/types'

export async function fetchCurrentPolicy(departmentId?: string): Promise<Policy> {
  const query = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : ''
  return apiGet<Policy>(`/policy/current${query}`)
}

export async function savePolicy(config: PIIConfig, departmentId?: string, publishImmediately = true): Promise<Policy> {
  return apiPut<Policy>('/policy/current', { config, department_id: departmentId || null, publishImmediately })
}

export const DEFAULT_POLICY_CONFIG: PIIConfig = {
  version: 1,
  categories: {
    FINANCIAL: { enabled: true, action: 'BLOCK', customKeywords: [], allowlist: [], fuzzyMatch: false },
    PII: { enabled: true, action: 'MASK', customKeywords: [], allowlist: [], fuzzyMatch: false },
    CONFIDENTIAL: { enabled: true, action: 'BLOCK', customKeywords: [], allowlist: [], fuzzyMatch: false },
    IP: { enabled: true, action: 'WARN_ALLOW', customKeywords: [], allowlist: [], fuzzyMatch: false },
  },
  monitoredPlatforms: ['chatgpt', 'gemini', 'google-ai-mode', 'copilot', 'claude', 'perplexity', 'meta-ai'],
  customDomains: [],
  allowPause: true,
  logUserEmail: false,
  sensitivityLevel: 'medium',
  updatedAt: new Date().toISOString(),
}
