// packages\shared\src\types\log.types.ts
// Audit Log Types
// Matches backend extension_service.ingest_log_batch field names exactly
// Backend gets userId/orgId from session — NOT from this payload
// ─────────────────────────────────────────────

import type { PIICategory, PolicyAction } from '../constants/pii-categories.constants'
import type { LLMPlatform } from '../constants/platforms.constants'
import type { DetectionTier } from './detection.types'

// Shape sent FROM extension TO backend /api/v1/extension/log
export interface AuditLog {
  eventId: string               // UUID — dedup key
  timestamp: string             // ISO 8601 UTC
  actionTaken: PolicyAction     // BLOCK | MASK | WARN_ALLOW | ALLOW
  categoryTriggered: PIICategory
  detectionType: string         // e.g. 'credit_card', 'email'
  detectionTier: DetectionTier  // regex | ner | ocr
  llmPlatform: string           // chatgpt | gemini | etc
  domain?: string               // window.location.hostname
  matchCount: number
  snippetHash?: string          // SHA-256 of matched value — NEVER raw text
  entityTypes?: string[]        // array of detected entity type strings
  severities?: string[]         // array of severity strings
  extensionVersion?: string
  osPlatform?: string
  browser?: string
  acknowledged?: boolean        // for WARN_ALLOW — did user acknowledge?
  latencyMs?: number            // detection pipeline time
  pipelineVersion?: string
}

// Shape used for the batch request body
export interface LogBatch {
  events: AuditLog[]
}

export interface LogFilters {
  startDate?: string
  endDate?: string
  action?: PolicyAction
  category?: PIICategory
  platform?: LLMPlatform
  domain?: string
  page?: number
  limit?: number
}

export interface LogStats {
  totalEvents: number
  blockedCount: number
  maskedCount: number
  warnedCount: number
  allowedCount: number
  topEntityTypes: Array<{ type: string; count: number }>
  topPlatforms: Array<{ platform: string; count: number }>
  topDomains: Array<{ domain: string; count: number }>
}