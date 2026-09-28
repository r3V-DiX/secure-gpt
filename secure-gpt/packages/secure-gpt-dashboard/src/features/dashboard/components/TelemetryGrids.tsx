'use client'

import React from 'react'
import { TrendingUp, Activity } from 'lucide-react'
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { EmptyState } from './QuickStatsRow'

interface TelemetryGridsProps {
  stats: any
  loading: boolean
}

export function TelemetryGrids({ stats, loading }: TelemetryGridsProps) {
  return (
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
            {stats?.topEntityTypes.slice(0, 8).map((item: any, i: number) => {
              const max = stats.topEntityTypes[0]?.count ?? 1
              const pct = Math.round((item.count / max) * 100)
              return (
                <div key={item.type} className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold w-4 text-right shrink-0 text-[var(--text-tertiary)]">
                        {i + 1}
                      </span>
                      <span className="text-[12px] font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                        {item.type}
                      </span>
                    </div>
                    <span className="text-[12px] tabular-nums font-semibold text-[var(--text-secondary)]">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-3)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)',
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
            {stats?.topDomains.slice(0, 8).map((item: any, i: number) => (
              <div
                key={item.domain}
                className="flex justify-between items-center py-2.5 group hover:px-1 transition-all duration-150 rounded"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-[12px] font-mono font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.domain}
                </span>
                <span
                  className="text-[11px] tabular-nums font-semibold ml-3 shrink-0 px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--accent-light)',
                    color: 'var(--accent-text)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
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
                {(stats.eventsByDay ?? []).reduce((s: number, d: any) => s + d.count, 0).toLocaleString()} total
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
                  cursor={{ fill: 'var(--bg-surface-2)', opacity: 0.6 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          className="px-3 py-2 rounded-md border shadow-lg"
                          style={{
                            background: 'var(--bg-surface)',
                            borderColor: 'var(--border-strong)',
                          }}
                        >
                          <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-0.5">
                            {new Date(payload[0].payload.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-[14px] font-bold text-[var(--text-primary)]">
                            {payload[0].value} <span className="text-[11px] font-medium text-[var(--text-tertiary)]">events</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1200}>
                  {(stats?.eventsByDay ?? []).map((entry: any, index: number) => {
                    const max = Math.max(...((stats?.eventsByDay ?? []).map((d: any) => d.count) ?? [1]))
                    const isMax = entry.count === max
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isMax ? 'var(--chart-primary)' : 'var(--chart-bar-bg)'}
                        stroke={isMax ? 'var(--chart-primary)' : 'var(--border-2)'}
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
  )
}
