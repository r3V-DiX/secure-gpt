// packages/extension/src/config/api.config.ts

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Dashboard URL — auth flows go through here so cookie lands on the right origin
export const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL ?? 'http://localhost:3000'

export const API_ENDPOINTS = {
  AUTH_GOOGLE: '/api/v1/auth/google',
  AUTH_ME: '/api/v1/auth/me',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  DEVICE_REGISTER: '/api/v1/devices',
  DEVICE_HEARTBEAT: (deviceId: string) => `/api/v1/devices/${deviceId}/heartbeat`,
  EXTENSION_POLICY: '/api/v1/extension/policy',
  EXTENSION_LOG: '/api/v1/extension/log',
} as const

export const LOG_BATCH_INTERVAL_MS = 3 * 1000
export const LOG_BATCH_MAX_SIZE = 50