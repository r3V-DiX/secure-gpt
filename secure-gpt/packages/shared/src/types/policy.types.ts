// ─────────────────────────────────────────────
// Policy Types
// ─────────────────────────────────────────────

import type { PIIConfig } from './config.types'

export interface OrgPolicy {
  id: string
  orgId: string
  config: PIIConfig
  createdBy: string             // admin user id
  version: number
  publishedAt: string           // ISO timestamp when pushed to devices
  isActive: boolean
}

export interface PolicyUpdatePayload {
  config: Partial<PIIConfig>
  publishImmediately: boolean
}

export interface DevicePolicyResponse {
  version: number
  config: PIIConfig
  updatedAt: string
}

// MDM pre-configured policy JSON structure
export interface MDMPolicy {
  orgId: string
  orgName: string
  adminEmail: string
  backendApiUrl: string
  deviceToken: string
  categories: PIIConfig['categories']
  monitoredPlatforms: PIIConfig['monitoredPlatforms']
  allowPause: boolean
  logUserEmail: boolean
}
