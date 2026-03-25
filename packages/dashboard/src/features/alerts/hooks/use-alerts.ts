'use client'
// src/features/alerts/hooks/use-alerts.ts
import { useState, useEffect, useCallback } from 'react'
import { fetchAlerts, fetchAlertSummary, type AlertFilters } from '../services/alerts.service'
import type { Alert, AlertSummary, Pagination } from '@/types'

export function useAlerts(initialFilters: AlertFilters = {}) {
    const [data, setData] = useState<Alert[]>([])
    const [summary, setSummary] = useState<AlertSummary | null>(null)
    const [pagination, setPagination] = useState<Pagination>({
        page: 1, page_size: 20, total: 0, total_pages: 1, has_next: false, has_prev: false,
    })
    const [filters, setFilters] = useState<AlertFilters>({ page: 1, page_size: 20, ...initialFilters })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async (f: AlertFilters) => {
        setLoading(true)
        setError(null)
        try {
            const [res, sum] = await Promise.all([fetchAlerts(f), fetchAlertSummary()])
            setData(res.data)
            setPagination(res.pagination)
            setSummary(sum)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load alerts')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { void load(filters) }, [filters, load])

    const setPage = (page: number) => setFilters(prev => ({ ...prev, page }))
    const setSeverity = (severity: string) => {
        if (severity) {
            setFilters(prev => ({ ...prev, severity, page: 1 }))
        } else {
            setFilters(prev => {
                const { severity: _removed, ...rest } = prev
                return { ...rest, page: 1 }
            })
        }
    }

    return { data, summary, pagination, filters, loading, error, setPage, setSeverity, reload: () => load(filters) }
}