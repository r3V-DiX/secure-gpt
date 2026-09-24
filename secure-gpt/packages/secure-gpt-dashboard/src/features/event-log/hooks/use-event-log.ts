'use client'
// src/features/event-log/hooks/use-event-log.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { fetchMyLogs, type LogFilters } from '../services/event-log.service'
import type { AuditLog, Pagination } from '@/types'

export function useEventLog(initialFilters: LogFilters = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, page_size: 20, total: 0, total_pages: 1, has_next: false, has_prev: false,
  })
  const [filters, setFilters] = useState<LogFilters>({ page: 1, page_size: 20, ...initialFilters })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (f: LogFilters, isBackground = false) => {
    if (!isBackground) {
      setLoading(true)
    }
    setError(null)
    try {
      const res = await fetchMyLogs(f)
      setData(res.data)
      setPagination(res.pagination)
    } catch (e: unknown) {
      if (!isBackground) {
        setError(e instanceof Error ? e.message : 'Failed to load logs')
      }
    } finally {
      if (!isBackground) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => { void load(filters) }, [filters, load])

  // Real-time auto-refresh polling (every 5 seconds) when on the first page and authenticated
  useEffect(() => {
    if (filters.page !== 1 || !user) return

    const interval = setInterval(() => {
      void load(filters, true)
    }, 5000)

    return () => clearInterval(interval)
  }, [filters, load, user])

  // AFTER
  const updateFilters = (updates: { [K in keyof LogFilters]?: LogFilters[K] | undefined }) =>
    setFilters(prev => {
      const next = { ...prev }
      for (const key of Object.keys(updates) as (keyof LogFilters)[]) {
        if (updates[key] === undefined) {
          delete next[key]
        } else {
          (next as Record<keyof LogFilters, unknown>)[key] = updates[key]
        }
      }
      return { ...next, page: 1 }
    })

  const setPage = (page: number) =>
    setFilters(prev => ({ ...prev, page }))

  return { data, pagination, filters, loading, error, updateFilters, setPage, reload: () => load(filters) }
}