'use client'

import React from 'react'
import { ShieldCheck, Ban, Sparkles } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'

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

function QuickStat({ label, value, sub, accent, icon }: {
  label: string; value: string; sub: string; accent: 'green' | 'red' | 'indigo'; icon?: React.ReactNode
}) {
  const percent = Math.min(100, Math.max(0, parseInt(value) || 0))
  const color = { green: 'bg-[var(--success)]', red: 'bg-[var(--danger)]', indigo: 'bg-[var(--accent)]' }[accent]
  return <StatCard label={label} value={value} sub={sub} accent={accent} icon={icon}
    footer={<div role="meter" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
      className="h-2 overflow-hidden rounded-full bg-[var(--bg-surface-3)]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>} />
}
