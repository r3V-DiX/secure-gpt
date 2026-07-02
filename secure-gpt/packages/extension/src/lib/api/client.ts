// ─────────────────────────────────────────────
// API Client — Extension
// Routes ALL requests through the dashboard proxy (securegpt.rkavach.com)
// NOT directly to the backend (api.securegpt.rkavach.com).
//
// WHY: The session cookie is set on securegpt.rkavach.com (dashboard domain).
// If we call api.securegpt.rkavach.com directly, the cookie won't be sent
// (different subdomain) and every request will 401.
//
// The dashboard Next.js proxy rewrites /api/v1/* → backend internally,
// so the cookie origin always matches.
// ─────────────────────────────────────────────

import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { authStorage } from '../storage/storage'
import { DASHBOARD_URL } from '@/config/api.config'

const apiClient: AxiosInstance = axios.create({
  baseURL: DASHBOARD_URL,         // ← dashboard proxy, NOT backend directly
  timeout: 10000,
  withCredentials: true,          // send httpOnly session cookie on every request
  headers: {
    'Content-Type': 'application/json',
    'X-Extension-Request': 'true', // tells backend to skip fingerprint validation
  },
})

// ── Response interceptor — handle session errors ──────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const status = error.response?.status
    const code = error.response?.data?.error?.code

    if (status === 401) {
      await authStorage.clearAuth()
      try {
        chrome.runtime.sendMessage({ type: 'AUTH_LOST', code })
      } catch {
        // Ignore — content script may not have runtime access
      }
    }

    const message =
      error.response?.data?.error?.message ??
      error.message ??
      'An unexpected error occurred'

    return Promise.reject(new Error(message))
  }
)

export default apiClient