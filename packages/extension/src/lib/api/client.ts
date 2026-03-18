// ─────────────────────────────────────────────
// API Client
// Axios instance for backend calls
// ─────────────────────────────────────────────

import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { authStorage } from '../storage/storage'
import { API_BASE_URL } from '@/config/api.config'

// ── Create instance ───────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor — attach JWT ──────────
apiClient.interceptors.request.use(async (config) => {
  const token = await authStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — handle 401 ────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — try refresh
      try {
        const auth = await authStorage.getAuth()
        if (auth?.tokens.refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: auth.tokens.refreshToken,
          })
          const newTokens = response.data.data
          await authStorage.setAuth({
            ...auth,
            tokens: { ...auth.tokens, ...newTokens },
          })
          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${newTokens.access_token}`
            return apiClient(error.config)
          }
        }
      } catch {
        // Refresh failed — clear auth
        await authStorage.clearAuth()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
