'use client'

import React from 'react'
import { Clock } from 'lucide-react'

interface DashboardHeaderProps {
  greeting: string
  firstName: string
  isSuperAdmin: boolean
}

export function DashboardHeader({
  greeting,
  firstName,
  isSuperAdmin,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 pt-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight text-[var(--text-primary)]">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {isSuperAdmin
            ? 'Global Platform Telemetry & Cross-Tenant Security Overview'
            : 'Your data protection summary for the last 30 days'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <Clock size={11} />
          Last 30 days
        </div>
      </div>
    </div>
  )
}
