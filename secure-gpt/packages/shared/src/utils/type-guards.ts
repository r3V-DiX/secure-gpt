// packages/shared/src/utils/type-guards.ts

import type { DetectionResult, PIIEntity } from '../types/detection.types'
import type { PIIConfig } from '../types/config.types'
import type { AuditLog } from '../types/log.types'
import { PII_CATEGORIES, POLICY_ACTIONS } from '../constants/pii-categories.constants'
import { LLM_PLATFORMS } from '../constants/platforms.constants'

export function isDetectionResult(value: unknown): value is DetectionResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hasFindings' in value &&
    'entities' in value &&
    Array.isArray((value as DetectionResult).entities)
  )
}

export function isPIIEntity(value: unknown): value is PIIEntity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'category' in value &&
    'value' in value &&
    'tier' in value
  )
}

export function isPIIConfig(value: unknown): value is PIIConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    'categories' in value &&
    'monitoredPlatforms' in value &&
    'version' in value
  )
}

export function isAuditLog(value: unknown): value is AuditLog {
  return (
    typeof value === 'object' &&
    value !== null &&
    'eventId' in value &&
    'actionTaken' in value &&
    'categoryTriggered' in value
  )
}

export function isValidPIICategory(value: string): value is keyof typeof PII_CATEGORIES {
  return Object.keys(PII_CATEGORIES).includes(value)
}

export function isValidPolicyAction(value: string): value is keyof typeof POLICY_ACTIONS {
  return Object.keys(POLICY_ACTIONS).includes(value)
}

export function isValidLLMPlatform(value: string): value is keyof typeof LLM_PLATFORMS {
  return Object.keys(LLM_PLATFORMS).includes(value)
}