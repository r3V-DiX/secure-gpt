'use client'
// src/app/(app)/dashboard/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { Activity, ShieldCheck, Ban, AlertTriangle, Clock, TrendingUp, Rocket, Sparkles, X, Building2, Users, Layers } from 'lucide-react'
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { StatCard } from '@/components/shared/StatCard'
import { OrgOnboardingBanner } from '@/features/onboarding/components/OrgOnboardingBanner'
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const ONBOARDING_DISMISS_KEY = 'securegpt:onboarding:dismissed'

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats, loading, error } = useDashboard(30)
  const { devices, loading: devicesLoading } = useProfile()
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(ONBOARDING_DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const showOnboarding = !devicesLoading && devices.length === 0 && !onboardingDismissed

  function dismissOnboarding() {
    setOnboardingDismissed(true)
    try {
      localStorage.setItem(ONBOARDING_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'platform_super_admin' || process.env.NEXT_PUBLIC_APP_MODE === 'admin'
  const isOrgAdmin = user?.role === 'org_admin' || user?.role === 'employer' || user?.role === 'security_admin' || Boolean(user?.orgId)

  return (
    <div className="w-full space-y-7 animate-fade-in pb-8">
      {/* ── Enterprise Organization Setup Reminder Banner ──────────── */}
      <OrgOnboardingBanner />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isSuperAdmin
              ? 'Global Platform Telemetry & Cross-Tenant Security Overview'
              : 'Your data protection summary for the last 30 days'}
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

      {/* ── Onboarding banner (extension not connected) ──────────────────── */}
      {showOnboarding && (
        <div
          className="relative overflow-hidden rounded-2xl border p-5 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--bg-surface) 65%)',
            borderColor: 'var(--accent-border)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className="size-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px var(--accent-glow)' }}
            >
              <Rocket size={20} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Welcome! Set up the SecureGPT extension
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Install the extension and connect your browser to start masking and blocking sensitive data before it reaches AI tools.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
                style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
              >
                <Sparkles size={13} />
                Get Started
              </Link>
              <button
                onClick={dismissOnboarding}
                aria-label="Dismiss onboarding"
                className="size-8 rounded-xl flex items-center justify-center border transition-all hover:brightness-105 cursor-pointer"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-tertiary)' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

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
            href="/event-logs"
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
            href="/event-logs?action=MASK"
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
            href="/event-logs?action=BLOCK"
          />
        </div>
        <div className="stagger-4 animate-fade-in">
          <StatCard
            label="Warned"
            value={stats?.warnedCount ?? stats?.cancelledCount ?? 0}
            sub="User bypassed warning"
            accent="amber"
            icon={<AlertTriangle size={14} />}
            loading={loading}
            href="/event-logs?action=WARN"
          />
        </div>
      </div>

      {/* ── Super Admin: Top Organizations Section ──────────────────────── */}
      {(isSuperAdmin || (stats?.topOrganizations && stats.topOrganizations.length > 0)) && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Building2 size={16} className="text-[var(--accent)]" />
                Top Organizations by Threat Interceptions
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Cross-tenant enterprise activity and policy interception volume
              </p>
            </div>
            <Link
              href="/users"
              className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              View User Directory →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : !stats?.topOrganizations || stats.topOrganizations.length === 0 ? (
            <EmptyState label="No organization telemetry recorded yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]" style={{ borderColor: 'var(--border)' }}>
                    <th className="pb-3 pl-2">Organization</th>
                    <th className="pb-3">Domain</th>
                    <th className="pb-3">Interceptions</th>
                    <th className="pb-3 pr-2 w-1/3">Threat Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {stats.topOrganizations.map((org, i) => (
                    <tr key={org.id || i} className="hover:bg-[var(--bg-surface-2)] transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] flex items-center justify-center font-bold text-xs">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{org.name}</span>
                      </td>
                      <td className="py-3.5 font-mono text-[var(--text-secondary)]">{org.domain || '—'}</td>
                      <td className="py-3.5 font-bold tabular-nums text-[var(--text-primary)]">
                        {org.count.toLocaleString()}
                      </td>
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--bg-surface-3)]">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${org.percent}%`,
                                background: org.color || 'var(--accent)',
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)] w-8 text-right">
                            {org.percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Org Admin: Top Users by Threat Interceptions ───────────────── */}
      {(!isSuperAdmin && (Boolean(stats?.topEmployees && stats.topEmployees.length > 0) || isOrgAdmin)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Employees */}
          <div className="card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Users size={16} className="text-[var(--accent)]" />
                  Top Users by DLP Interceptions
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">Team members triggering DLP sensitivity policies</p>
              </div>
              <Link href="/team" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                Manage Team →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : !stats?.topEmployees || stats.topEmployees.length === 0 ? (
              <EmptyState label="No user violations recorded yet" />
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {stats.topEmployees.map((emp, i) => (
                  <div key={emp.email || i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-full flex items-center justify-center font-bold text-xs bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-[var(--text-primary)]">{emp.name}</p>
                        <p className="text-[11px] truncate text-[var(--text-tertiary)]">{emp.email} • {emp.dept}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-full bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]">
                      {emp.count} threats
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Departments */}
          <div className="card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Layers size={16} className="text-[var(--accent)]" />
                  Top Departments
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">Interception density across organizational units</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : !stats?.topDepartments || stats.topDepartments.length === 0 ? (
              <EmptyState label="No department activity recorded yet" />
            ) : (
              <div className="space-y-3">
                {stats.topDepartments.map((dept, i) => (
                  <div key={dept.name || i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[var(--text-primary)]">{dept.name}</span>
                      <span className="font-bold tabular-nums text-[var(--text-secondary)]">{dept.count} events ({dept.percent}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-surface-3)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${dept.percent}%`, background: dept.color || 'var(--accent)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Entity types */}
        <div className="card p-5 animate-fade-in stagger-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Top Entity Types
            </h2>
            <TrendingUp size={14} className="text-[var(--text-secondary)]" />
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
            <div className="space-y-3.5">
              {stats?.topEntityTypes.slice(0, 8).map((item, i) => {
                const max = stats.topEntityTypes[0]?.count ?? 1
                const pct = Math.round((item.count / max) * 100)
                return (
                  <div key={item.type} className="group">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold w-4 text-right shrink-0 text-[var(--text-secondary)]">
                          {i + 1}
                        </span>
                        <span className="text-[12.5px] font-mono font-semibold"
                          style={{ color: 'var(--text-primary)' }}>
                          {item.type}
                        </span>
                      </div>
                      <span className="text-[12px] tabular-nums font-bold text-[var(--text-secondary)]">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-surface-3)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, var(--accent) 0%, #6366f1 100%)',
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
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Active Domains
            </h2>
            <Activity size={14} className="text-[var(--text-secondary)]" />
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
                  <span className="text-[12.5px] font-mono font-semibold truncate"
                    style={{ color: 'var(--text-primary)' }}>
                    {item.domain}
                  </span>
                  <span className="text-xs tabular-nums font-bold ml-3 shrink-0 px-2.5 py-0.5 rounded-full"
                    style={{
                      background: 'var(--accent-light)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent-border)'
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
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Events Over Time
              </h2>
              {!loading && stats && (stats.eventsByDay?.length ?? 0) > 0 && (
                <p className="text-xs font-semibold mt-0.5 text-[var(--text-secondary)]">
                  {(stats.eventsByDay ?? []).reduce((s, d) => s + d.count, 0).toLocaleString()} total
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-28 rounded-lg" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ) : (stats?.eventsByDay ?? []).length === 0 ? (
            <EmptyState label="No events in period" />
          ) : (
            <div className="h-32 min-h-[128px] min-w-0 w-full -mx-2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={128}>
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
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                      const max = Math.max(...((stats?.eventsByDay ?? []).map(d => d.count) ?? [1]))
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
                {([(stats?.eventsByDay ?? [])[0], (stats?.eventsByDay ?? [])[Math.floor((stats?.eventsByDay ?? []).length / 2)], (stats?.eventsByDay ?? [])[(stats?.eventsByDay ?? []).length - 1]])
                  .filter((d): d is { date: string; count: number } => d !== undefined)
                  .map((d, i) => (
                    <span key={i} className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
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
              : '0%'
            }
            sub="Passed cleanly"
            accent="green"
            icon={<ShieldCheck size={15} />}
          />
          <QuickStat
            label="Block rate"
            value={stats.totalEvents > 0
              ? `${Math.round((stats.blockedCount / stats.totalEvents) * 100)}%`
              : '0%'
            }
            sub="Stopped by policy"
            accent="red"
            icon={<Ban size={15} />}
          />
          <QuickStat
            label="Mask rate"
            value={stats.totalEvents > 0
              ? `${Math.round((stats.maskedCount / stats.totalEvents) * 100)}%`
              : '0%'
            }
            sub="PII redacted"
            accent="indigo"
            icon={<Sparkles size={15} />}
          />
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function QuickStat({
  label, value, sub, accent, icon,
}: {
  label: string
  value: string
  sub: string
  accent: 'green' | 'red' | 'indigo'
  icon?: React.ReactNode
}) {
  const config = {
    green: {
      border: 'var(--success-border)',
      bg: 'var(--success-light)',
      accentColor: 'var(--success)',
      bar: 'var(--success)',
    },
    red: {
      border: 'var(--danger-border)',
      bg: 'var(--danger-light)',
      accentColor: 'var(--danger)',
      bar: 'var(--danger)',
    },
    indigo: {
      border: 'var(--accent-border)',
      bg: 'var(--accent-light)',
      accentColor: 'var(--accent)',
      bar: 'var(--accent)',
    },
  }[accent]

  const numericValue = parseInt(value.replace('%', '')) || 0

  return (
    <div
      className="card p-5 transition-all duration-200 flex flex-col justify-between gap-3 group hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div
              className="size-7 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                background: config.bg,
                borderColor: config.border,
                color: config.accentColor,
              }}
            >
              {icon}
            </div>
          )}
          <span
            className="text-[12px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-primary)' }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border"
          style={{
            background: config.bg,
            borderColor: config.border,
            color: config.accentColor,
          }}
        >
          Rate
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div
          className="text-[32px] font-extrabold tracking-tight leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </div>
        <div
          className="text-xs font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          {sub}
        </div>
      </div>

      <div
        className="h-2 w-full rounded-full overflow-hidden mt-1"
        style={{ background: 'var(--bg-surface-3)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(0, numericValue))}%`,
            background: config.bar,
          }}
        />
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="text-2xl opacity-75">📭</div>
      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  )
}