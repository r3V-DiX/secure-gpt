// packages/dashboard/src/features/event-log/mappers/event-log.mapper.ts
// Maps raw API responses to display-ready formats.
import type { AuditLog } from '@/types'

export function formatAction(action: string): string {
    const map: Record<string, string> = {
        BLOCK: 'Blocked', MASK: 'Masked', WARN_ALLOW: 'Warned', ALLOW: 'Allowed',
    }
    return map[action] ?? action
}

export function formatDetectionType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function getTopSeverity(severities: string[]): string {
    const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    return order.find(s => severities.includes(s)) ?? 'LOW'
}

export function logToTableRow(log: AuditLog) {
    return {
        ...log,
        formattedTime: new Date(log.receivedAt).toLocaleString(),
        formattedAction: formatAction(log.actionTaken),
        formattedType: formatDetectionType(log.detectionType),
        topSeverity: getTopSeverity(log.severities),
    }
}