// ─────────────────────────────────────────────
// Shared Formatters
// ─────────────────────────────────────────────

import type { PolicyAction, PIICategory } from '../constants/pii-categories.constants'
import {
  POLICY_ACTION_LABELS,
  PII_CATEGORY_LABELS,
} from '../constants/pii-categories.constants'
import { PLATFORM_LABELS } from '../constants/platforms.constants'
import type { LLMPlatform } from '../constants/platforms.constants'

export function formatPolicyAction(action: PolicyAction): string {
  return POLICY_ACTION_LABELS[action] ?? action
}

export function formatPIICategory(category: PIICategory): string {
  return PII_CATEGORY_LABELS[category] ?? category
}

export function formatLLMPlatform(platform: LLMPlatform): string {
  return PLATFORM_LABELS[platform] ?? platform
}

export function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString()
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export function formatMatchCount(count: number): string {
  return count === 1 ? '1 item' : `${count} items`
}
