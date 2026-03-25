// src/features/alerts/services/alerts.service.ts
import { apiGetPaginated, apiGet } from '@/lib/api/client'
import type { Alert, AlertSummary, PaginatedResult } from '@/types'

export interface AlertFilters {
    page?: number
    page_size?: number
    severity?: string
}

export async function fetchAlerts(filters: AlertFilters = {}): Promise<PaginatedResult<Alert>> {
    const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
    ) as Record<string, unknown>
    return apiGetPaginated<Alert>('/alerts', params)
}

export async function fetchAlertSummary(): Promise<AlertSummary> {
    return apiGet<AlertSummary>('/alerts/summary')
}