import React, { useState } from 'react'
// src/features/event-log/components/EventLogTable.tsx
import { Badge, actionVariant } from '@/components/ui/badge/badge'
import { Pagination } from '@/components/data-display/pagination'
import { Eye, EyeOff } from 'lucide-react'
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
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  function toggleExpandLog(id: string) {
    setExpandedLogId(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Action', 'User', 'Category', 'Detection', 'Platform', 'Entities', 'Time'].map(h => (
                <th key={h}
                  className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                  {h}
                </th>
              ))}
              <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-3/4" /></td>
                  ))}
                </tr>
              ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
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
                  <React.Fragment key={log.id}>
                    <tr
                      style={{ borderBottom: '1px solid var(--border)', animationDelay: `${i * 15}ms` }}
                      className="animate-fade-in transition-all duration-150 hover:bg-[var(--bg-surface-2)]/60 cursor-default">
                      <td className="px-4 py-3">
                        <Badge variant={actionVariant(log.actionTaken)}>{log.actionTaken}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium truncate max-w-[150px]" style={{ color: 'var(--text-secondary)' }} title={log.userEmail || 'System'}>
                        {log.userEmail || 'System'}
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
                      <td className="px-4 py-3 text-right">
                        <button
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] transition-all active:scale-95 cursor-pointer shadow-sm"
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={() => toggleExpandLog(log.id)}
                        >
                          {expandedLogId === log.id ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>{expandedLogId === log.id ? 'Hide' : 'Inspect'}</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded details block */}
                    {expandedLogId === log.id && (
                      <tr className="bg-white/[0.01] dark:bg-black/[0.05]">
                        <td colSpan={8} className="py-4 px-6 border-b border-[var(--border-2)]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left">
                            {/* Left column: Event details */}
                            <div className="space-y-2.5">
                              <div>
                                <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>Event ID</span>
                                <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{log.eventId || log.id}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>Match Count</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{log.matchCount} matched elements</span>
                                </div>
                                <div>
                                  <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>Latency (Processing)</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{log.latencyMs ? `${log.latencyMs} ms` : '—'}</span>
                                </div>
                              </div>
                              {log.domain && (
                                <div>
                                  <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>Source Domain / Page</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{log.domain}</span>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4 pt-1">
                                <div>
                                  <span className="block" style={{ color: 'var(--text-tertiary)' }}>Operating System</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{log.osPlatform || 'Unknown'}</span>
                                </div>
                                <div>
                                  <span className="block" style={{ color: 'var(--text-tertiary)' }}>Browser & Version</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{log.browser || 'Unknown'}</span>
                                </div>
                              </div>
                              {log.extensionVersion && (
                                <div>
                                  <span className="block" style={{ color: 'var(--text-tertiary)' }}>Extension Version</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>v{log.extensionVersion}</span>
                                </div>
                              )}
                            </div>

                            {/* Right column: Risk & classifications */}
                            <div className="space-y-3 bg-[var(--bg-surface-2)] p-4 rounded-xl border border-[var(--border-2)]">
                              <h4 className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                Risk Classification
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="block text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Entity Categories</span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {log.entityTypes.map(et => (
                                      <span key={et} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                                        style={{ background: 'var(--bg-surface-3)', color: 'var(--text-primary)' }}>
                                        {et}
                                      </span>
                                    ))}
                                    {log.entityTypes.length === 0 && <span className="italic text-gray-400">None detected</span>}
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Entity Severities</span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {log.severities.map((sev, idx) => (
                                      <Badge key={idx} variant={sev === 'CRITICAL' || sev === 'HIGH' ? 'danger' : 'info'}>
                                        {sev}
                                      </Badge>
                                    ))}
                                    {log.severities.length === 0 && <span className="italic text-gray-400">None</span>}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-[var(--border-2)] flex items-center justify-between">
                                  <span style={{ color: 'var(--text-secondary)' }}>User Acknowledged Warning</span>
                                  <Badge variant={log.acknowledged ? 'success' : 'neutral'}>
                                    {log.acknowledged ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
            }
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  )
}

