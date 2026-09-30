// ─────────────────────────────────────────────
// Default Config
// Applied when user skips wizard
// ─────────────────────────────────────────────

import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'

export const DEFAULT_EXTENSION_CONFIG: PIIConfig = {
  ...DEFAULT_PII_CONFIG,
}

export const EXTENSION_VERSION = '1.2.4'

export const PAUSE_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
] as const
