// packages/dashboard/src/lib/api/client.ts
// Single Axios instance — session-cookie auth, auto-unwraps backend envelope.
//
// KEY FIX: baseURL is /api/v1 (relative) — all requests go to localhost:3000
// which Next.js proxies to the backend. This means the session cookie is
// always on the same origin (localhost:3000) — no cross-origin cookie issues.

import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Public paths where 401 should NOT trigger a redirect to login
const PUBLIC_PATH_PREFIXES = ['/privacy', '/terms', '/login', '/callback']

const isPublicPath = (): boolean => {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return PUBLIC_PATH_PREFIXES.some(p => path === p || path.startsWith(p))
}

// ── Request interceptor — fingerprint header ──────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const fp = [
      navigator.platform,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      `${screen.width}x${screen.height}`,
    ].join('|')
    config.headers['X-Client-Fingerprint'] = fp
  }
  return config
})

// ── Response interceptor — unwrap envelope, signal session expiry on 401 ─────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401 && !isPublicPath()) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session-expired'))
      }
    }
    const message =
      error.response?.data?.error?.message ??
      error.response?.data?.detail ??
      error.message ??
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

export default apiClient

export interface BackendEnvelope<T> {
  success: boolean
  data: T
  message: string
  timestamp: string
}

export interface BackendPaginatedEnvelope<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  message: string
  timestamp: string
}

export async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<BackendEnvelope<T>>(path, { params })
  return res.data.data
}

export async function apiGetPaginated<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<{ data: T[]; pagination: BackendPaginatedEnvelope<T>['pagination'] }> {
  const res = await apiClient.get<BackendPaginatedEnvelope<T>>(path, { params })
  return { data: res.data.data, pagination: res.data.pagination }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.post<BackendEnvelope<T>>(path, body)
  return res.data.data
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.put<BackendEnvelope<T>>(path, body)
  return res.data.data
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await apiClient.delete<BackendEnvelope<T>>(path)
  return res.data.data
}