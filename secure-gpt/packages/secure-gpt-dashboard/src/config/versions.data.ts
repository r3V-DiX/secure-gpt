// packages/secure-gpt-dashboard/src/config/versions.data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Version Types & Empty Fallbacks for SecureGPT Dashboard
// Releases are loaded at runtime from /api/v1/system/releases (backed by RDS).
// ─────────────────────────────────────────────────────────────────────────────

export * from './versions.types'
import type { VersionItem } from './versions.types'

export const BASELINE_VERSIONS: VersionItem[] = []
export const ADMIN_VERSIONS: VersionItem[] = []
export const EXTENSION_VERSIONS: VersionItem[] = []
