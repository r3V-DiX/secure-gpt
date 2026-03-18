// ─────────────────────────────────────────────
// Dashboard API Client
// Axios instance with JWT + auto-refresh
// ─────────────────────────────────────────────

import axios, { type AxiosInstance } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/backend',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post('/api/backend/auth/refresh', { refresh_token: refresh })
          const newToken = (res.data as { data: { access_token: string } }).data.access_token
          localStorage.setItem('access_token', newToken)
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${newToken}`
            return apiClient(error.config)
          }
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
