'use client'

import React from 'react'
import { ShieldCheck, Ban, Sparkles } from 'lucide-react'
import { InboxIcon } from '@/components/icons'

interface QuickStatsRowProps {
  stats: {
    totalEvents: number
    allowedCount: number
    blockedCount: number
    maskedCount: number
  } | null
  loading: boolean
}

export function QuickStatsRow({ stats, loading }: QuickStatsRowProps) {
  if (loading || !stats) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
      <QuickStat
        label="Allow rate"
        value={stats.totalEvents > 0 ? `${Math.round((stats.allowedCount / stats.totalEvents) * 100)}%` : '0%'}
        sub="Passed cleanly"
        accent="green"
        icon={<ShieldCheck size={15} />}
      />
      <QuickStat
        label="Block rate"
        value={stats.totalEvents > 0 ? `${Math.round((stats.blockedCount / stats.totalEvents) * 100)}%` : '0%'}
        sub="Stopped by policy"
        accent="red"
        icon={<Ban size={15} />}
      />
      <QuickStat
        label="Mask rate"
        value={stats.totalEvents > 0 ? `${Math.round((stats.maskedCount / stats.totalEvents) * 100)}%` : '0%'}
        sub="PII redacted"
        accent="indigo"
        icon={<Sparkles size={15} />}
      />
    </div>
  )
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="size-10 rounded-xl flex items-center justify-center bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-tertiary)]">
        <InboxIcon size={20} />
      </div>
      <p className="text-xs font-semibold text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

function QuickStat({
  label,
  value,
  sub,
  accent,
  icon,
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
      className="card p-5 transition-all duration-200 flex flex-col justify-between gap-3 group"
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
        <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
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
