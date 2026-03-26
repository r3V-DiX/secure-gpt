'use client'
// src/app/(app)/dashboard/page.tsx
import { Activity, ShieldCheck, Ban, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard'
import { useAuth } from '@/contexts/auth-context'
import { StatCard } from '@/components/shared/StatCard'

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats, loading, error } = useDashboard(30)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  return (
    <div className="max-w-[1280px] space-y-7 animate-fade-in pb-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Your data protection summary for the last 30 days
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}>
            <Clock size={11} />
            Last 30 days
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
          }}>
          {error}
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stagger-1 animate-fade-in">
          <StatCard
            label="Total Events"
            value={stats?.totalEvents ?? 0}
            sub="All pipeline events"
            accent="indigo"
            icon={<Activity size={14} />}
            loading={loading}
          />
        </div>
        <div className="stagger-2 animate-fade-in">
          <StatCard
            label="Masked"
            value={stats?.maskedCount ?? 0}
            sub="PII redacted before send"
            accent="green"
            icon={<ShieldCheck size={14} />}
            loading={loading}
          />
        </div>
        <div className="stagger-3 animate-fade-in">
          <StatCard
            label="Blocked"
            value={stats?.blockedCount ?? 0}
            sub="Blocked by policy"
            accent="red"
            icon={<Ban size={14} />}
            loading={loading}
          />
        </div>
        <div className="stagger-4 animate-fade-in">
          <StatCard
            label="Warned"
            value={stats?.cancelledCount ?? 0}
            sub="User bypassed warning"
            accent="amber"
            icon={<AlertTriangle size={14} />}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Entity types */}
        <div className="card p-5 animate-fade-in stagger-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}>
              Top Entity Types
            </h2>
            <TrendingUp size={13} style={{ color: 'var(--text-tertiary)' }} />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-1.5 rounded-full" />
                </div>
              ))}
            </div>
          ) : stats?.topEntityTypes.length === 0 ? (
            <EmptyState label="No detections yet" />
          ) : (
            <div className="space-y-3">
              {stats?.topEntityTypes.slice(0, 8).map((item, i) => {
                const max = stats.topEntityTypes[0]?.count ?? 1
                const pct = Math.round((item.count / max) * 100)
                return (
                  <div key={item.type} className="group">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold w-4 text-right shrink-0"
                          style={{ color: 'var(--text-tertiary)' }}>
                          {i + 1}
                        </span>
                        <span className="text-xs font-mono font-medium"
                          style={{ color: 'var(--text-primary)' }}>
                          {item.type}
                        </span>
                      </div>
                      <span className="text-xs tabular-nums font-medium"
                        style={{ color: 'var(--text-secondary)' }}>
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-surface-3)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, var(--accent) 0%, #818cf8 100%)',
                          animationDelay: `${i * 80}ms`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top domains */}
        <div className="card p-5 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}>
              Active Domains
            </h2>
            <Activity size={13} style={{ color: 'var(--text-tertiary)' }} />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2">
                  <div className="skeleton h-3.5 w-28 rounded" />
                  <div className="skeleton h-3.5 w-8 rounded" />
                </div>
              ))}
            </div>
          ) : stats?.topDomains.length === 0 ? (
            <EmptyState label="No domains recorded" />
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {stats?.topDomains.slice(0, 8).map((item, i) => (
                <div key={item.domain}
                  className="flex justify-between items-center py-2.5 group hover:px-1 transition-all duration-150 rounded"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="text-xs font-mono truncate"
                    style={{ color: 'var(--text-primary)' }}>
                    {item.domain}
                  </span>
                  <span className="text-xs tabular-nums font-semibold ml-3 shrink-0 px-2 py-0.5 rounded-full"
                    style={{
                      background: 'var(--accent-light)',
                      color: 'var(--accent-text)',
                    }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events over time */}
        <div className="card p-5 animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)' }}>
                Events Over Time
              </h2>
              {!loading && stats && stats.eventsByDay.length > 0 && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {stats.eventsByDay.reduce((s, d) => s + d.count, 0).toLocaleString()} total
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-28 rounded-lg" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ) : stats?.eventsByDay.length === 0 ? (
            <EmptyState label="No events in period" />
          ) : (
            <MiniBarChart data={stats?.eventsByDay ?? []} />
          )}
        </div>
      </div>

      {/* ── Quick stats row ─────────────────────────────────────────────── */}
      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <QuickStat
            label="Allow rate"
            value={stats.totalEvents > 0
              ? `${Math.round((stats.allowedCount / stats.totalEvents) * 100)}%`
              : '—'
            }
            sub="Events that passed through"
            accent="green"
          />
          <QuickStat
            label="Block rate"
            value={stats.totalEvents > 0
              ? `${Math.round((stats.blockedCount / stats.totalEvents) * 100)}%`
              : '—'
            }
            sub="Events stopped by policy"
            accent="red"
          />
          <QuickStat
            label="Mask rate"
            value={stats.totalEvents > 0
              ? `${Math.round((stats.maskedCount / stats.totalEvents) * 100)}%`
              : '—'
            }
            sub="Events with PII redacted"
            accent="indigo"
          />
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-0.5 h-28">
        {data.map((d, i) => {
          const heightPct = Math.max(4, (d.count / max) * 100)
          return (
            <div
              key={d.date}
              className="relative flex-1 min-w-0 group cursor-default"
              style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
            >
              <div
                title={`${d.date}: ${d.count}`}
                className="w-full rounded-t-sm transition-all duration-300"
                style={{
                  height: `${heightPct}%`,
                  background: d.count === max
                    ? 'linear-gradient(180deg, var(--accent) 0%, #818cf8 100%)'
                    : 'var(--accent-light)',
                  border: '1px solid var(--accent-border)',
                  borderBottom: 'none',
                  animationDelay: `${i * 20}ms`,
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-2)',
                  color: 'var(--text-primary)',
                }}>
                {d.count}
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels — show first, middle, last */}
      <div className="flex justify-between">
        {([data[0], data[Math.floor(data.length / 2)], data[data.length - 1]] as Array<{ date: string; count: number } | undefined>)
          .filter((d): d is { date: string; count: number } => d !== undefined)
          .map((d, i) => (
            <span key={i} className="text-[9px] font-mono"
              style={{ color: 'var(--text-tertiary)' }}>
              {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          ))}
      </div>
    </div>
  )
}

function QuickStat({
  label, value, sub, accent,
}: {
  label: string
  value: string
  sub: string
  accent: 'green' | 'red' | 'indigo'
}) {
  const colors = {
    green:  { bg: 'var(--success-light)',  border: 'var(--success-border)',  text: 'var(--success)' },
    red:    { bg: 'var(--danger-light)',   border: 'var(--danger-border)',   text: 'var(--danger)' },
    indigo: { bg: 'var(--accent-light)',   border: 'var(--accent-border)',   text: 'var(--accent-text)' },
  }[accent]

  return (
    <div className="rounded-2xl p-4 border"
      style={{ background: colors.bg, borderColor: colors.border }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: colors.text, opacity: 0.7 }}>
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: colors.text, opacity: 0.6 }}>
        {sub}
      </p>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="text-2xl opacity-30">📭</div>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  )
}