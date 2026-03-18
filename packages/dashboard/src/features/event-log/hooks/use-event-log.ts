'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchLogs, type LogFilters, type LogsResponse } from '../services/event-log.service'
import type { AuditLog } from '@securegpt/shared/types'

export function useEventLog(initialFilters: LogFilters = {}) {
  const [data, setData] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 1, has_next: false, has_prev: false })
  const [filters, setFilters] = useState<LogFilters>({ page: 1, limit: 50, ...initialFilters })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (f: LogFilters) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchLogs(f)
      setData(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(filters) }, [filters, load])

  function updateFilters(updates: Partial<LogFilters>) {
    setFilters((prev) => ({ ...prev, ...updates, page: 1 }))
  }

  function setPage(page: number) {
    setFilters((prev) => ({ ...prev, page }))
  }

  return { data, pagination, filters, loading, error, updateFilters, setPage, reload: () => load(filters) }
}
