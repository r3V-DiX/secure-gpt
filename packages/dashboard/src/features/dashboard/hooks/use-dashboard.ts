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
    setLoading(true)
    fetchDashboardStats(days)
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [days])

  return { stats, loading, error }
}