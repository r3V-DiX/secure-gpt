'use client'
// src/hooks/use-sidebar-badges.ts
// Fetches alert summary to show count badge on sidebar Alerts link.
// Polls every 60s so the count stays fresh without hammering the backend.

import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '@/lib/api/client'
import type { AlertSummary } from '@/types'

interface SidebarBadges {
    alertCount: number | null   // null = loading
    loading: boolean
}

const POLL_INTERVAL_MS = 60_000

export function useSidebarBadges(): SidebarBadges {
    const [alertCount, setAlertCount] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        try {
            const summary = await apiGet<AlertSummary>('/alerts/summary')
            setAlertCount(summary.total)
        } catch {
            // Silently fail — badges are non-critical
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetch()
        const interval = setInterval(fetch, POLL_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [fetch])

    return { alertCount, loading }
}