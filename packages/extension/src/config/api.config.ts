// ─────────────────────────────────────────────
// API Config
// ─────────────────────────────────────────────

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const API_ENDPOINTS = {
  // Auth
  AUTH_GOOGLE_URL: '/api/v1/auth/google/url',
  AUTH_GOOGLE_CALLBACK: '/api/v1/auth/google/callback',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  AUTH_ME: '/api/v1/auth/me',
  AUTH_LOGOUT: '/api/v1/auth/logout',

  // Devices
  DEVICE_ENROLL: '/api/v1/devices/enroll',
  DEVICE_HEARTBEAT: '/api/v1/devices/heartbeat',

  // Policy — extension polling
  POLICY_DEVICE: (orgId: string) => `/api/v1/policy/device/${orgId}`,

  // Logs — batch submission
  LOGS_BATCH: '/api/v1/logs/batch',
} as const

// Policy sync interval — 15 minutes
export const POLICY_SYNC_INTERVAL_MS = 15 * 60 * 1000

// Log batch interval — 30 seconds
export const LOG_BATCH_INTERVAL_MS = 30 * 1000

// Max log batch size per PRD
export const LOG_BATCH_MAX_SIZE = 50
