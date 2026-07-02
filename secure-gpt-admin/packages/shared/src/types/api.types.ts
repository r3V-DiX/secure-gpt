// ─────────────────────────────────────────────
// API Types
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>  // field-level validation errors
  }
  timestamp: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp: string
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down'
  version: string
  timestamp: string
}
