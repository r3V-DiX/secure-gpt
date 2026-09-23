'use client'

import { useState } from 'react'
import { useIncidents } from '@/features/incidents/hooks/use-incidents'
import { ShieldAlert, RefreshCw, Filter, CheckCircle } from 'lucide-react'
import { Button, ActionBadge, EmptyState } from '@/components/ui'
import type { PolicyAction } from '@securegpt/shared/constants'

export default function IncidentsPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const { incidents, loading, error, fetchIncidents } = useIncidents(undefined, selectedSeverity || undefined)

  const getSeverityColor = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'text-rose-400'
      case 'MEDIUM':
        return 'text-amber-400'
      default:
        return 'text-blue-400'
    }
  }

  return (
    <div className="space-y-7 pb-28 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ShieldAlert className="text-[var(--accent)]" size={24} />
            Enterprise DLP Incident Stream
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Real-time audit log of intercepted sensitive data and prompt violations across all employees.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => fetchIncidents()}>
          <RefreshCw size={14} className="mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div
        className="flex items-center gap-3 p-3 rounded-md border bg-[var(--bg-surface)] border-[var(--border)]"
      >
        <Filter size={15} className="text-[var(--text-tertiary)] ml-1" />
        <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">Filter Severity:</span>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-[var(--border-2)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div
        className="border rounded-md overflow-hidden shadow-sm bg-[var(--bg-surface)] border-[var(--border)]"
      >
        <table className="w-full text-left text-sm">
          <thead
            className="border-b text-xs uppercase font-semibold border-[var(--border)] text-[var(--text-tertiary)] bg-[var(--bg-surface-2)]"
          >
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Triggered Policy</th>
              <th className="px-5 py-3.5">Target AI</th>
              <th className="px-5 py-3.5">Action Taken</th>
              <th className="px-5 py-3.5">Redacted Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-[var(--text-tertiary)]">
                  Loading incident logs…
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">
                  <EmptyState
                    icon={CheckCircle}
                    title="No Incidents Recorded"
                    description="No prompt violations or security incidents recorded yet. Clean compliance!"
                  />
                </td>
              </tr>
            ) : (
              incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-[var(--bg-surface-2)] transition-colors">
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap text-[var(--text-tertiary)]">
                    {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-xs text-[var(--text-primary)]">
                    {inc.user_email}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${getSeverityColor(inc.severity)}`}>●</span>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">
                        {inc.policy_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-[var(--text-secondary)]">
                    {inc.target_app}
                  </td>
                  <td className="px-5 py-3.5">
                    <ActionBadge action={inc.action_taken as PolicyAction} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-xs px-2 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-2)] max-w-xs truncate text-[var(--text-tertiary)]">
                      {inc.redacted_snippet}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
