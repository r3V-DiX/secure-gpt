'use client'
// src/features/dashboard/hooks/use-dashboard.ts
import { useState, useEffect } from 'react'
import { fetchDashboardStats } from '../services/dashboard.service'
import type { DashboardStats } from '@/types'

export function useDashboard(days = 30) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadStats = async (isBackground = false) => {
      if (!isBackground) {
        setLoading(true)
      }
      try {
        const data = await fetchDashboardStats(days)
        if (active) {
          setStats(data)
        }
      } catch (e: unknown) {
        if (active && !isBackground) {
          setError(e instanceof Error ? e.message : 'Failed to fetch dashboard stats')
        }
      } finally {
        if (active && !isBackground) {
          setLoading(false)
        }
      }
    }

    void loadStats(false)

    // Poll every 5 seconds for real-time overview updates
    const interval = setInterval(() => {
      void loadStats(true)
    }, 5000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [days])

  return { stats, loading, error }
}