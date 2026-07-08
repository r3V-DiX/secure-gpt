// src/features/dashboard/services/dashboard.service.ts
import { apiGet } from '@/lib/api/client'
import type { DashboardStats } from '@/types'

export async function fetchDashboardStats(days = 30): Promise<DashboardStats> {
  return apiGet<DashboardStats>('/event-logs/dashboard', { days })
}