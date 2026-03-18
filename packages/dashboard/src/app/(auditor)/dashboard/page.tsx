'use client'

import { useEffect, useState } from 'react'
import { fetchLogStats } from '@/features/event-log/services/event-log.service'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Badge } from '@/components/ui/badge/badge'
import { PII_CATEGORY_LABELS, PLATFORM_LABELS } from '@securegpt/shared/constants'
import type { PIICategory } from '@securegpt/shared/constants'
import type { LLMPlatform } from '@securegpt/shared/constants'
import type { LogStats } from '@securegpt/shared/types'

export default function AuditorDashboardPage() {
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="sg-card h-24 bg-gray-100" />)}</div>
        <div className="grid grid-cols-2 gap-6">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="sg-card h-60 bg-gray-100" />)}</div>
      </div>
    )
  }

  const actionData = [
    { name: 'Blocked', value: stats?.blockedCount ?? 0, color: '#dc2626' },
    { name: 'Masked', value: stats?.maskedCount ?? 0, color: '#d97706' },
    { name: 'Warned', value: stats?.warnedCount ?? 0, color: '#ea580c' },
    { name: 'Allowed', value: stats?.allowedCount ?? 0, color: '#2563eb' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="sg-page-title">Audit Overview</h1>
        <p className="sg-page-subtitle">Read-only view of all detection events across the organisation</p>
      </div>

      {/* Read-only notice */}
      <div className="sg-card p-3 bg-blue-50 border-blue-100 flex items-center gap-2">
        <span className="text-base">🔍</span>
        <p className="text-xs text-blue-700">
          <strong>Auditor view:</strong> You have read-only access to all logs and reports. Policy changes are not available.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats?.totalEvents ?? 0, color: 'blue', icon: '📊' },
          { label: 'Blocked', value: stats?.blockedCount ?? 0, color: 'red', icon: '🚫' },
          { label: 'Masked', value: stats?.maskedCount ?? 0, color: 'amber', icon: '🎭' },
          { label: 'Warned', value: stats?.warnedCount ?? 0, color: 'orange', icon: '⚠️' },
        ].map((card) => {
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-700',
            red: 'bg-red-50 text-red-700',
            amber: 'bg-amber-50 text-amber-700',
            orange: 'bg-orange-50 text-orange-700',
          }
          return (
            <div key={card.label} className="sg-card p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colorMap[card.color]}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions chart */}
        <div className="sg-card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Actions breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actionData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {actionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top categories */}
        <div className="sg-card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Top triggered categories</h2>
          <div className="space-y-3">
            {(stats?.topCategories ?? []).map((item, i) => {
              const max = stats?.topCategories[0]?.count ?? 1
              const pct = Math.round((item.count / max) * 100)
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">{PII_CATEGORY_LABELS[item.category as PIICategory] ?? item.category}</span>
                    <span className="text-gray-400">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {!stats?.topCategories?.length && <p className="text-sm text-gray-400 text-center py-4">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Top platforms */}
      <div className="sg-card p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Platform activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(stats?.topPlatforms ?? []).map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700 capitalize">
                {PLATFORM_LABELS[item.platform as LLMPlatform] ?? item.platform}
              </span>
              <Badge variant="neutral">{item.count}</Badge>
            </div>
          ))}
          {!stats?.topPlatforms?.length && <p className="text-sm text-gray-400 col-span-3 text-center py-4">No data yet</p>}
        </div>
      </div>
    </div>
  )
}
