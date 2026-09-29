'use client'

import { PageHeader } from '@/components/ui'
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui'
import React, { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { ClipboardList, Eye, EyeOff, Loader2, Download } from 'lucide-react'
import { downloadAuditLogsCsv } from '@/lib/utils/export'
import type { SystemAuthLog } from '@/types'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<SystemAuthLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const { toast } = useToast()

  async function loadLogs() {
    try {
      setLoading(true)
      const data = await apiGet<SystemAuthLog[]>('/admin/audit-logs')
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

  async function handleExport() {
    try {
      setExporting(true)
      await downloadAuditLogsCsv()
      toast.success('Audit logs exported successfully.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to export audit logs.')
    } finally {
      setExporting(false)
    }
  }

  function getEventVariant(eventType: string) {
    if (eventType.includes('success')) return 'success'
    if (eventType.includes('failed') || eventType.includes('mismatch') || eventType.includes('suspicious')) return 'danger'
    if (eventType.includes('expire') || eventType.includes('invalidate')) return 'warning'
    return 'neutral'
  }

  return (
    <div className="flex-1 space-y-6 w-full animate-fade-in pb-8">
      {/* Header */}
      <PageHeader title={<>
            <ClipboardList className="text-[var(--accent)] size-5 shrink-0" />
            System Audit Logs
          </>} description={<>
            Track who logged in/out, check device fingerprints, monitor suspicious actions, and export data for ML model training.
          </>} actions={<><Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          loading={exporting}
          disabled={logs.length === 0}
          icon={<Download size={13} />}
        >
          Export CSV
        </Button></>} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[var(--accent)] size-8" />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading authentication audit logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md p-12 text-center flex flex-col items-center gap-2 shadow-lg">
          <ClipboardList className="size-12" style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No authentication events</h3>
          <p className="text-[11px] max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
            Login history and user sessions will appear here as users authenticate.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <Table className="w-full text-left border-collapse">
              <TableHead>
                <TableRow className="border-b border-[var(--border-2)] bg-[var(--bg-surface-2)] text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  <TableHeaderCell className="py-3 px-4">Timestamp</TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4">User</TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4">Event Type</TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4">Status</TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4">Fingerprint Hash</TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 text-right">Details</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y divide-[var(--border-2)] text-[13px]">
                {logs.map(log => {
                  const isExpanded = expandedLogId === log.id
                  return (
                    <React.Fragment key={log.id}>
                      <TableRow className="hover:bg-white/5 transition-colors">
                        <TableCell className="py-3.5 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {log.userName || log.userEmail}
                          {log.userEmail && log.userName && (
                            <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{log.userEmail}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 font-semibold text-[var(--accent-text)] uppercase text-[11px]">
                          {log.eventType.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <Badge variant={getEventVariant(log.eventType)}>
                            {log.success ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {log.fingerprintHash ? `${log.fingerprintHash.slice(0, 12)}...` : 'N/A'}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={isExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                            onClick={() => toggleExpandLog(log.id)}
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded state details block */}
                      {isExpanded && (
                        <TableRow className="bg-white/[0.02]">
                          <TableCell colSpan={6} className="py-4 px-6 border-b border-[var(--border-2)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Left metadata column */}
                              <div className="space-y-2">
                                <div>
                                  <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>Log Entry ID</span>
                                  <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{log.id}</span>
                                </div>
                                {log.userId && (
                                  <div>
                                    <span className="block font-medium" style={{ color: 'var(--text-tertiary)' }}>User ID</span>
                                    <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{log.userId}</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 gap-2 pt-1.5">
                                  <div>
                                    <span className="block" style={{ color: 'var(--text-tertiary)' }}>Device Fingerprint (SHA-256)</span>
                                    <span className="font-mono break-all text-[11px]" style={{ color: 'var(--text-secondary)' }}>{log.fingerprintHash || 'None'}</span>
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

                              {/* Right metadata / event properties JSON column */}
                              <div className="space-y-3 bg-[var(--bg-surface-2)] p-4 rounded-xl border border-[var(--border-2)]">
                                <h4 className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                  Event Details & Metadata
                                </h4>

                                {log.metadata ? (
                                  <div className="font-mono text-[11px]">
                                    <pre className="bg-gray-100/50 border border-gray-200 text-gray-800 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 p-3 rounded-xl overflow-x-auto max-h-[160px] whitespace-pre-wrap leading-tight">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                ) : (
                                  <span className="italic" style={{ color: 'var(--text-tertiary)' }}>No extra metadata recorded.</span>
                                )}
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
        </div>
      )}
    </div>
  )
}
