'use client'

import { PageHeader } from '@/components/ui'
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
    <PageHeader title={<>
          {greeting}, {firstName}
        </>} description={<>
          {isSuperAdmin
            ? 'Global Platform Telemetry & Cross-Tenant Security Overview'
            : 'Your data protection summary for the last 30 days'}
        </>} actions={<><div className="flex items-center gap-2">
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
      </div></>} />
  )
}
