'use client'

import React from 'react'
import { Activity, ShieldCheck, Ban, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'

interface KpiCardsRowProps {
  stats: any
  loading: boolean
}

export function KpiCardsRow({ stats, loading }: KpiCardsRowProps) {
  return (
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
  )
}
