'use client'
// src/app/(app)/dashboard/page.tsx
import { Activity, ShieldCheck, Ban, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard'
import { useAuth } from '@/contexts/auth-context'
import { StatCard } from '@/components/shared/StatCard'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'

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
            <div className="h-32 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.eventsByDay ?? []}>
                  <Tooltip
                    cursor={{ fill: 'var(--bg-surface-2)', opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="px-3 py-2 rounded-xl border shadow-xl backdrop-blur-md"
                            style={{ 
                              background: 'var(--bg-surface)', 
                              borderColor: 'var(--border-2)',
                              boxShadow: 'var(--shadow-lg)'
                            }}>
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
                              {new Date(payload[0].payload.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-sm font-bold" style={{ color: 'var(--accent-text)' }}>
                              {payload[0].value} <span className="text-[10px] font-medium text-[var(--text-secondary)]">events</span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  >
                    {(stats?.eventsByDay ?? []).map((entry, index) => {
                      const max = Math.max(...(stats?.eventsByDay.map(d => d.count) ?? [1]))
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.count === max ? 'var(--accent)' : 'var(--accent-light)'}
                          stroke={entry.count === max ? 'var(--accent)' : 'var(--accent-border)'}
                          strokeWidth={1}
                        />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 px-2">
                {([stats?.eventsByDay[0], stats?.eventsByDay[Math.floor(stats?.eventsByDay.length / 2)], stats?.eventsByDay[stats?.eventsByDay.length - 1]])
                  .filter((d): d is { date: string; count: number } => d !== undefined)
                  .map((d, i) => (
                    <span key={i} className="text-[9px] font-mono font-medium"
                      style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  ))}
              </div>
            </div>
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

function QuickStat({
  label, value, sub, accent,
}: {
  label: string
  value: string
  sub: string
  accent: 'green' | 'red' | 'indigo'
}) {
  const colors = {
    green:  { bg: 'from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-transparent', border: 'border-emerald-100/80 dark:border-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', glow: 'hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.08)] hover:border-emerald-300 dark:hover:border-emerald-500/30' },
    red:    { bg: 'from-red-50/50 to-white dark:from-red-950/20 dark:to-transparent', border: 'border-red-100/80 dark:border-red-500/15', text: 'text-red-600 dark:text-red-400', glow: 'hover:shadow-[0_8px_30px_-4px_rgba(239,68,68,0.08)] hover:border-red-300 dark:hover:border-red-500/30' },
    indigo: { bg: 'from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-transparent', border: 'border-indigo-100/80 dark:border-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', glow: 'hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.08)] hover:border-indigo-300 dark:hover:border-indigo-500/30' },
  }[accent]

  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${colors.bg} ${colors.border} ${colors.glow} transition-all duration-300 group`}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight leading-none group-hover:scale-[1.01] transition-transform duration-200 ${colors.text}`}>
        {value}
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
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