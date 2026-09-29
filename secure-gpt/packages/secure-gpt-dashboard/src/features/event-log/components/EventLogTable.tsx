import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button } from '@/components/ui'
import React, { useState } from 'react'
// src/features/event-log/components/EventLogTable.tsx
import { Badge, actionVariant } from '@/components/ui/badge/badge'
import { EmptyState } from '@/components/ui/empty-state/EmptyState'
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
      <div className="rounded-md border overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <Table className="w-full text-sm border-collapse">
          <TableHead>
            <TableRow style={{ borderBottom: '1px solid var(--border)' }}>
              {['Action', 'Category', 'Detection', 'Platform', 'Entities', 'Time'].map(h => (
                <TableHeaderCell key={h}
                  className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                  {h}
                </TableHeaderCell>
              ))}
              <TableHeaderCell className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                Details
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j} className="px-4 py-3"><div className="skeleton h-4 w-3/4" /></TableCell>
                  ))}
                </TableRow>
              ))
              : data.length === 0
                ? (
                  <TableRow>
                      <TableCell colSpan={7} className="p-8">
                        <EmptyState
                          title="No Event Logs Found"
                          description="No logs matching your selected filter criteria. Try clearing or expanding your filters."
                        />
                      </TableCell>
                  </TableRow>
                )
                : data.map((log, i) => {
                  const logKey = log.id || log.eventId || String(i)
                  return (
                  <React.Fragment key={logKey}>
                    <TableRow
                      onClick={() => toggleExpandLog(logKey)}
                      style={{ borderBottom: '1px solid var(--border)', animationDelay: `${i * 15}ms` }}
                      className="animate-fade-in transition-all duration-150 hover:bg-[var(--bg-surface-2)]/60 cursor-pointer">
                      <TableCell className="px-4 py-3">
                        <Badge variant={actionVariant(log.actionTaken)}>{log.actionTaken}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {log.categoryTriggered}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {log.detectionType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] uppercase tracking-tighter" style={{ color: 'var(--text-tertiary)' }}>
                            {log.detectionTier}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-2">
                          {PLATFORM_ICONS[log.llmPlatform] ? (
                            <img src={PLATFORM_ICONS[log.llmPlatform]} alt="" className="size-4 shrink-0 object-contain" />
                          ) : null}
                          <span>{log.llmPlatform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(log.entityTypes ?? []).slice(0, 2).map(et => (
                            <span key={et}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                              style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}>
                              {et}
                            </span>
                          ))}
                          {(log.entityTypes ?? []).length > 2 && (
                            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              +{(log.entityTypes ?? []).length - 2}
                            </span>
                          )}
                          {(log.entityTypes ?? []).length === 0 && <span className="text-xs text-[var(--text-tertiary)]">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs tabular-nums whitespace-nowrap"
                        style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Button variant="secondary" type="button"
                          className="inline-flex"

                        >
                          {expandedLogId === logKey ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>{expandedLogId === logKey ? 'Hide' : 'Inspect'}</span>
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded details block */}
                    {expandedLogId === logKey && (
                      <TableRow className="bg-white/[0.01] dark:bg-black/[0.05]">
                        <TableCell colSpan={7} className="py-4 px-6 border-b border-[var(--border-2)]">
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
                                    {(log.entityTypes ?? []).map(et => (
                                      <span key={et} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                                        style={{ background: 'var(--bg-surface-3)', color: 'var(--text-primary)' }}>
                                        {et}
                                      </span>
                                    ))}
                                    {(log.entityTypes ?? []).length === 0 && <span className="italic text-gray-400">None detected</span>}
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Entity Severities</span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {(log.severities ?? []).map((sev, idx) => (
                                      <Badge key={idx} variant={sev === 'CRITICAL' || sev === 'HIGH' ? 'danger' : 'info'}>
                                        {sev}
                                      </Badge>
                                    ))}
                                    {(log.severities ?? []).length === 0 && <span className="italic text-gray-400">None</span>}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-[var(--border-2)] flex items-center justify-between">
                                  <span style={{ color: 'var(--text-secondary)' }}>User Acknowledged Warning</span>
                                  <span className="font-semibold" style={{ color: log.acknowledged ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                                    {log.acknowledged ? 'Yes (Bypassed)' : 'No'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Privacy explanation */}
                            <div className="md:col-span-2 mt-2 p-3 rounded-xl flex items-start gap-3" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                              <span className="mt-0.5 text-sm" aria-hidden="true">ℹ️</span>
                              <div>
                                <h5 className="font-bold text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Privacy by Design</h5>
                                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                  SecureGPT intentionally does not store the raw prompt or blocked text. Your sensitive data is processed locally and never leaves your browser.
                                </p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                  )
                })}
          </TableBody>
        </Table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  )
}

