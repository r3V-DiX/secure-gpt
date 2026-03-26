'use client'
// src/app/(app)/alerts/page.tsx
import { useAlerts } from '@/features/alerts/hooks/use-alerts'
import { Pagination } from '@/components/data-display/pagination'
import { actionVariant, Badge, severityVariant } from '@/components/ui/badge/badge'
import { Bell, ShieldOff, AlertTriangle, Zap } from 'lucide-react'

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function AlertsPage() {
  const { data, summary, pagination, loading, error, setPage, setSeverity, filters } = useAlerts()

  const summaryCards = [
    { label: 'Total',    value: summary?.total,                icon: <Bell size={14} />,        accent: 'indigo' },
    { label: 'Blocked',  value: summary?.blocked,              icon: <ShieldOff size={14} />,   accent: 'red' },
    { label: 'Warned',   value: summary?.warned,               icon: <AlertTriangle size={14} />, accent: 'amber' },
    { label: 'Critical', value: summary?.bySeverity?.CRITICAL, icon: <Zap size={14} />,         accent: 'red' },
  ] as const

  const accentMap = {
    indigo: { bg: 'var(--accent-light)',   border: 'var(--accent-border)',   text: 'var(--accent-text)',  icon: 'var(--accent)' },
    red:    { bg: 'var(--danger-light)',   border: 'var(--danger-border)',   text: 'var(--danger)',       icon: 'var(--danger)' },
    amber:  { bg: 'var(--warning-light)',  border: 'var(--warning-border)',  text: 'var(--warning)',      icon: 'var(--warning)' },
  }

  return (
    <div className="max-w-[1200px] space-y-5 animate-fade-in pb-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Alerts
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Events where policy blocked or warned on your submissions
        </p>
      </div>

      {/* Summary cards */}
      {!loading && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryCards.map((s, i) => {
            const colors = accentMap[s.accent as keyof typeof accentMap]
            return (
              <div key={s.label}
                className="rounded-2xl p-4 border stagger-1 animate-fade-in"
                style={{ background: colors.bg, borderColor: colors.border, animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: colors.text, opacity: 0.7 }}>
                    {s.label}
                  </p>
                  <span style={{ color: colors.icon }}>{s.icon}</span>
                </div>
                <p className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
                  {s.value ?? 0}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Severity filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...SEVERITIES].map(sev => {
          const active = filters.severity === sev || (!sev && !filters.severity)
          return (
            <button
              key={sev || 'all'}
              onClick={() => setSeverity(sev)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={{
                background: active ? 'var(--accent-light)' : 'var(--bg-surface)',
                borderColor: active ? 'var(--accent-border)' : 'var(--border)',
                color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {sev || 'All'}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm font-medium"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Severity', 'Action', 'Category', 'Platform', 'Domain', 'Entities', 'Time'].map(h => (
                <th key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap"
                  style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-3/4" /></td>
                  ))}
                </tr>
              ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl opacity-30">🎉</span>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          No alerts — great job!
                        </p>
                      </div>
                    </td>
                  </tr>
                )
                : data.map((alert, i) => (
                  <tr key={alert.id}
                    style={{ borderBottom: '1px solid var(--border)', animationDelay: `${i * 30}ms` }}
                    className="animate-fade-in transition-colors"
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ''}>
                    <td className="px-4 py-3">
                      <Badge variant={severityVariant(alert.topSeverity)} dot>{alert.topSeverity}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={actionVariant(alert.actionTaken)}>{alert.actionTaken}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {alert.categoryTriggered}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {alert.llmPlatform}
                    </td>
                    <td className="px-4 py-3">
                      {alert.domain
                        ? <code className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{alert.domain}</code>
                        : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {alert.entityTypes.slice(0, 3).map(et => (
                          <span key={et}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                            style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}>
                            {et}
                          </span>
                        ))}
                        {alert.entityTypes.length > 3 && (
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            +{alert.entityTypes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums whitespace-nowrap"
                      style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  )
}