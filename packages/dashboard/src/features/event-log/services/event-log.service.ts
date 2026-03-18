// ─────────────────────────────────────────────
// Event Log Service
// ─────────────────────────────────────────────

import apiClient from '@/lib/api/client'
import type { AuditLog, LogStats } from '@securegpt/shared/types'

export interface LogFilters {
  page?: number
  limit?: number
  user_id?: string
  action?: string
  category?: string
  platform?: string
  start_date?: string
  end_date?: string
}

export interface LogsResponse {
  data: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export async function fetchLogs(filters: LogFilters = {}): Promise<LogsResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  )
  const res = await apiClient.get('/logs', { params })
  return res.data as LogsResponse
}

export async function fetchMyLogs(filters: LogFilters = {}): Promise<LogsResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  )
  const res = await apiClient.get('/logs/my', { params })
  return res.data as LogsResponse
}

export async function fetchLogStats(): Promise<LogStats> {
  const res = await apiClient.get('/logs/stats')
  return (res.data as { data: LogStats }).data
}
