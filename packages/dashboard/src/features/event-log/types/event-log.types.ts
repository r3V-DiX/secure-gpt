// packages/dashboard/src/features/event-log/types/event-log.types.ts
export type { AuditLog, ActionType, SeverityLevel, Pagination, PaginatedResult } from '@/types'

export interface LogFilters {
    page?: number
    page_size?: number
    action?: string | undefined
    category?: string | undefined
    platform?: string | undefined
    domain?: string | undefined
    start_date?: string | undefined
    end_date?: string | undefined
}