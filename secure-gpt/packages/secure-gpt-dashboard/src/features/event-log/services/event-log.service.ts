// src/features/event-log/services/event-log.service.ts
import { apiGetPaginated } from '@/lib/api/client'
import type { AuditLog, PaginatedResult } from '@/types'

export interface LogFilters {
  page?: number
  page_size?: number
  action?: string
  category?: string
  platform?: string
  search?: string
  start_date?: string
  end_date?: string
}

export async function fetchMyLogs(filters: LogFilters = {}): Promise<PaginatedResult<AuditLog>> {
  // Strip undefined/empty values
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  ) as Record<string, unknown>

  return apiGetPaginated<AuditLog>('/event-logs', params)
}