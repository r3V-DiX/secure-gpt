// ─────────────────────────────────────────────
// Policy Service — Dashboard
// ─────────────────────────────────────────────

import apiClient from '@/lib/api/client'
import type { PIIConfig } from '@securegpt/shared/types'

export interface PolicyVersion {
  id: string
  version: number
  is_active: boolean
  published_at: string | null
  created_at: string
}

export async function fetchCurrentPolicy(): Promise<{ config: PIIConfig; version: number }> {
  const res = await apiClient.get('/policy/current')
  return (res.data as { data: { config: PIIConfig; version: number } }).data
}

export async function updatePolicy(config: PIIConfig, publishImmediately = true): Promise<void> {
  await apiClient.put('/policy', { config, publish_immediately: publishImmediately })
}

export async function fetchPolicyHistory(): Promise<PolicyVersion[]> {
  const res = await apiClient.get('/policy/history')
  return (res.data as { data: PolicyVersion[] }).data
}
