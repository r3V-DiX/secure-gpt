// ─────────────────────────────────────────────
// API Client — Extension
// Session-cookie auth. withCredentials: true so the httpOnly cookie
// is sent automatically on every request.
//
// KEY CHANGES from old version:
//   - No Bearer token header — session cookie handles auth
//   - withCredentials: true — sends cookie cross-origin to backend
//   - X-Extension-Request: true — tells backend to skip fingerprint check
//     for background service worker requests
//   - 401 handler just clears stored user + notifies popup — no refresh
// ─────────────────────────────────────────────

import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { authStorage } from '../storage/storage'
import { API_BASE_URL } from '@/config/api.config'

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
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
      // Session expired, revoked or fingerprint mismatch
      // Clear stored user and notify background to update popup state
      await authStorage.clearAuth()

      // Notify all extension contexts that auth was lost
      try {
        chrome.runtime.sendMessage({ type: 'AUTH_LOST', code })
      } catch {
        // Ignore — content script may not have runtime access
      }
    }

    // Always reject with a clean error message
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      'An unexpected error occurred'

    return Promise.reject(new Error(message))
  }
)

export default apiClient