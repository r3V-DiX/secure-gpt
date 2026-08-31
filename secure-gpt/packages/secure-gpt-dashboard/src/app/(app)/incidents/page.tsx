'use client'

import { useState } from 'react'
import { useIncidents } from '@/features/incidents/hooks/use-incidents'
import {
  ShieldAlert, AlertTriangle, CheckCircle, RefreshCw,
  Filter, Search, Terminal, Ban, EyeOff, FileWarning
} from 'lucide-react'
import { Button } from '@/components/ui/button/button'

export default function IncidentsPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const { incidents, loading, error, fetchIncidents } = useIncidents(undefined, selectedSeverity || undefined)

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BLOCK':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
            <Ban size={12} /> BLOCKED
          </span>
        )
      case 'MASK':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
            <EyeOff size={12} /> MASKED
          </span>
        )
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-semibold">
            <FileWarning size={12} /> WARNED
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            LOG ONLY
          </span>
        )
    }
  }

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
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ShieldAlert className="text-[var(--accent)]" size={22} />
            Enterprise DLP Incident Stream
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Real-time audit log of intercepted sensitive data and prompt violations across all employees.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => fetchIncidents()}>
          <RefreshCw size={14} className="mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 p-3 rounded-2xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <Filter size={15} className="text-[var(--text-tertiary)] ml-1" />
        <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">Filter Severity:</span>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-xl border bg-[var(--bg-base)] focus:outline-none focus:border-[var(--accent)]"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div className="border rounded-2xl overflow-hidden shadow-sm"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase font-semibold"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}>
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Triggered Policy</th>
              <th className="px-5 py-3.5">Target AI</th>
              <th className="px-5 py-3.5">Action Taken</th>
              <th className="px-5 py-3.5">Redacted Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Loading incident logs…
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  No prompt violations or incidents recorded yet. Clean compliance!
                </td>
              </tr>
            ) : (
              incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
                    {inc.user_email}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${getSeverityColor(inc.severity)}`}>
                        ●
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {inc.policy_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {inc.target_app}
                  </td>
                  <td className="px-5 py-3.5">
                    {getActionBadge(inc.action_taken)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-xs px-2 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] max-w-xs truncate text-[var(--text-tertiary)]">
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
