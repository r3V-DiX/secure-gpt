'use client'
// src/features/event-log/components/EventLogTable.tsx
import { Badge, actionVariant } from '@/components/ui/badge/badge'
import { Pagination } from '@/components/data-display/pagination'
import type { AuditLog, Pagination as PaginationType } from '@/types'

const PLATFORM_ICONS: Record<string, string> = {
  chatgpt: '/icons/chatgpt.png',
  gemini: '/icons/gemini.png',
  copilot: '/icons/copilot.png',
  claude: '/icons/claude.png',
  perplexity: '/icons/perplexity.png',
  'meta-ai': '/icons/meta-ai.png',
}

interface EventLogTableProps {
  data: AuditLog[]
  pagination: PaginationType
  loading: boolean
  onPageChange: (page: number) => void
}

export function EventLogTable({ data, pagination, loading, onPageChange }: EventLogTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Action', 'Category', 'Detection', 'Platform', 'Entities', 'Time'].map(h => (
                <th key={h}
                  className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-3/4" /></td>
                  ))}
                </tr>
              ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl opacity-30">📭</span>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          No logs found matching your filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )
                : data.map((log, i) => (
                  <tr key={log.id}
                    style={{ borderBottom: '1px solid var(--border)', animationDelay: `${i * 15}ms` }}
                    className="animate-fade-in transition-all duration-150 hover:bg-[var(--bg-surface-2)]/60 cursor-default">
                    <td className="px-4 py-3">
                      <Badge variant={actionVariant(log.actionTaken)}>{log.actionTaken}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {log.categoryTriggered}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {log.detectionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] uppercase tracking-tighter" style={{ color: 'var(--text-tertiary)' }}>
                          {log.detectionTier}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                      <div className="flex items-center gap-2">
                        {PLATFORM_ICONS[log.llmPlatform] ? (
                          <img src={PLATFORM_ICONS[log.llmPlatform]} alt="" className="size-4 shrink-0 object-contain" />
                        ) : null}
                        <span>{log.llmPlatform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {log.entityTypes.slice(0, 2).map(et => (
                          <span key={et}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                            style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}>
                            {et}
                          </span>
                        ))}
                        {log.entityTypes.length > 2 && (
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            +{log.entityTypes.length - 2}
                          </span>
                        )}
                        {log.entityTypes.length === 0 && <span className="text-xs text-[var(--text-tertiary)]">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums whitespace-nowrap"
                      style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  )
}
