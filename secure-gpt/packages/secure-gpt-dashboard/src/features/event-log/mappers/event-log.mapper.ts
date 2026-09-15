// packages/dashboard/src/features/event-log/mappers/event-log.mapper.ts
// Maps raw API responses to display-ready formats.
import type { AuditLog } from '@/types'

export function formatAction(action: string): string {
    const normalized = action?.toUpperCase()
    const map: Record<string, string> = {
        BLOCK: 'Blocked',
        BLOCKED: 'Blocked',
        MASK: 'Masked',
        MASKED: 'Masked',
        WARN: 'Warned',
        WARNED: 'Warned',
        WARN_ALLOW: 'Warned',
        ALLOW: 'Allowed',
        ALLOWED: 'Allowed',
    }
    return map[normalized] ?? action
}


export function formatDetectionType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function getTopSeverity(severities?: string[]): string {
    if (!severities || severities.length === 0) return 'LOW'
    const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    return order.find(s => severities.includes(s)) ?? 'LOW'
}

export function logToTableRow(log: AuditLog) {
    return {
        ...log,
        formattedTime: new Date(log.receivedAt || log.timestamp).toLocaleString(),
        formattedAction: formatAction(log.actionTaken),
        formattedType: formatDetectionType(log.detectionType),
        topSeverity: getTopSeverity(log.severities),
    }
}