'use client'

import React, { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { ShieldCheck, History, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import type { AdminAuditLog } from '@/types'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const { toast } = useToast()

  async function loadLogs() {
    try {
      setLoading(true)
      const data = await apiGet<AdminAuditLog[]>('/admin/audit-logs')
      setLogs(data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load system audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
  }, [])

  function toggleExpandLog(id: string) {
    setExpandedLogId(prev => (prev === id ? null : id))
  }

  function getRiskVariant(level: string) {
    switch (level) {
      case 'CRITICAL': return 'danger'
      case 'HIGH': return 'warning'
      case 'MEDIUM': return 'info'
      default: return 'neutral'
    }
  }

  function getStatusVariant(status: string) {
    return status === 'SUCCESS' ? 'success' : 'danger'
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <History className="text-[var(--accent)] size-5 shrink-0" />
            System Audit Logs
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            Audit administrative activities, role alterations, policy changes, and configuration updates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[var(--accent)] size-8" />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading system audit trail...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-2xl p-12 text-center flex flex-col items-center gap-2 shadow-lg">
          <History className="size-12" style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No audit logs recorded</h3>
          <p className="text-[11px] max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
            System actions and settings changes will appear here once administrative configurations occur.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-2)] bg-[var(--bg-surface-2)] text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-2)] text-[13px]">
                {logs.map(log => {
                  const isExpanded = expandedLogId === log.id
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {log.userName || log.userEmail || 'System'}
                          {log.userEmail && log.userName && (
                            <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{log.userEmail}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[var(--accent-text)]">
                          {log.action}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="neutral">{log.module}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getRiskVariant(log.riskLevel)}>{log.riskLevel}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={isExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                            onClick={() => toggleExpandLog(log.id)}
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded state details block */}
                      {isExpanded && (
                        <tr className="bg-white/[0.02]">
                          <td colSpan={7} className="py-4 px-6 border-b border-[var(--border-2)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Left metadata column */}
                              <div className="space-y-2">
                                <div>
                                  <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>Log Entry ID</span>
                                  <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{log.id}</span>
                                </div>
                                {log.description && (
                                  <div>
                                    <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>Description</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{log.description}</span>
                                  </div>
                                )}
                                {log.entityId && (
                                  <div>
                                    <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>Target Entity</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                      {log.entityType} ({log.entityName || log.entityId})
                                    </span>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 pt-1.5">
                                  <div>
                                    <span className="block" style={{ color: 'var(--text-tertiary)' }}>Client IP</span>
                                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{log.ipAddress || 'Unknown'}</span>
                                  </div>
                                  <div>
                                    <span className="block" style={{ color: 'var(--text-tertiary)' }}>User Roles</span>
                                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                                      {log.userRoles?.join(', ') || 'none'}
                                    </span>
                                  </div>
                                </div>
                                {log.userAgent && (
                                  <div className="pt-1">
                                    <span className="block" style={{ color: 'var(--text-tertiary)' }}>User Agent</span>
                                    <span className="text-[10px] break-all leading-tight" style={{ color: 'var(--text-secondary)' }}>
                                      {log.userAgent}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Right state diff/JSON column */}
                              <div className="space-y-3 bg-[var(--bg-surface-2)] p-4 rounded-xl border border-[var(--border-2)]">
                                <h4 className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                  Configuration Changes (State)
                                </h4>
                                
                                {log.beforeState || log.afterState ? (
                                  <div className="space-y-3 font-mono text-[11px]">
                                    {log.beforeState && (
                                      <div>
                                        <span className="font-semibold block mb-0.5 text-red-600 dark:text-red-400">Previous state:</span>
                                        <pre className="bg-gray-100/50 border border-gray-200 text-gray-800 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 p-3 rounded-xl overflow-x-auto max-h-[120px] whitespace-pre-wrap leading-tight">
                                          {JSON.stringify(log.beforeState, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    {log.afterState && (
                                      <div>
                                        <span className="font-semibold block mb-0.5 text-emerald-600 dark:text-emerald-400">Updated state:</span>
                                        <pre className="bg-gray-100/50 border border-gray-200 text-gray-800 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 p-3 rounded-xl overflow-x-auto max-h-[120px] whitespace-pre-wrap leading-tight">
                                          {JSON.stringify(log.afterState, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="italic" style={{ color: 'var(--text-tertiary)' }}>No state transitions recorded.</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )

}
