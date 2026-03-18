// ─────────────────────────────────────────────
// Audit Log Types
// ─────────────────────────────────────────────

import type { PIICategory, PolicyAction } from '../constants/pii-categories.constants'
import type { LLMPlatform } from '../constants/platforms.constants'
import type { DetectionTier } from './detection.types'

export interface AuditLog {
  eventId: string               // UUID
  timestamp: string             // ISO 8601 UTC
  userId: string                // hashed employee identifier
  userEmail?: string            // optional — admin configurable
  orgId: string
  department?: string
  actionTaken: PolicyAction
  categoryTriggered: PIICategory
  detectionType: string         // e.g. 'credit_card_number', 'email_address'
  detectionTier: DetectionTier
  llmPlatform: LLMPlatform
  matchCount: number            // number of sensitive items detected
  snippetHash: string           // SHA-256 of matched snippet — never raw text
  extensionVersion: string
  osPlatform: string
  browser: string
  acknowledged?: boolean        // for WARN_ALLOW — did user acknowledge?
}

export interface LogBatch {
  deviceToken: string
  orgId: string
  events: AuditLog[]
}

export interface LogFilters {
  startDate?: string
  endDate?: string
  userId?: string
  orgId?: string
  action?: PolicyAction
  category?: PIICategory
  platform?: LLMPlatform
  page?: number
  limit?: number
}

export interface LogStats {
  totalEvents: number
  blockedCount: number
  maskedCount: number
  warnedCount: number
  allowedCount: number
  topCategories: Array<{ category: PIICategory; count: number }>
  topPlatforms: Array<{ platform: LLMPlatform; count: number }>
  topUsers: Array<{ userId: string; count: number }>
}
