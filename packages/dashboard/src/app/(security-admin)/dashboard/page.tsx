'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { POLICY_ACTION_LABELS, PII_CATEGORY_LABELS } from '@securegpt/shared/constants'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'

interface Stats {
  total_events: number
  blocked_count: number
  masked_count: number
  warned_count: number
  allowed_count: number
  top_categories: Array<{ category: string; count: number }>
  top_platforms: Array<{ platform: string; count: number }>
  top_users: Array<{ user_id: string; count: number }>
}

const ACTION_COLORS: Record<string, string> = {
  BLOCK: '#dc2626', MASK: '#d97706', WARN_ALLOW: '#ea580c', ALLOW: '#2563eb',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/logs/stats')
      .then((r) => setStats((r.data as { data: Stats }).data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const actionData = stats ? [
    { name: 'Blocked', value: stats.blocked_count, color: '#dc2626' },
    { name: 'Masked', value: stats.masked_count, color: '#d97706' },
    { name: 'Warned', value: stats.warned_count, color: '#ea580c' },
    { name: 'Allowed', value: stats.allowed_count, color: '#2563eb' },
  ] : []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="sg-page-title">Security Dashboard</h1>
        <p className="sg-page-subtitle">Overview of data protection activity across your organisation</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Events" value={stats?.total_events ?? 0} icon="📊" color="blue" />
        <KPICard label="Blocked" value={stats?.blocked_count ?? 0} icon="🚫" color="red" />
        <KPICard label="Masked" value={stats?.masked_count ?? 0} icon="🎭" color="amber" />
        <KPICard label="Warned" value={stats?.warned_count ?? 0} icon="⚠️" color="orange" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions breakdown */}
        <div className="sg-card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Actions breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actionData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {actionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top categories */}
        <div className="sg-card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Top triggered categories</h2>
          <div className="space-y-3">
            {(stats?.top_categories ?? []).map((item, i) => {
              const max = stats?.top_categories[0]?.count ?? 1
              const pct = Math.round((item.count / max) * 100)
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">
                      {PII_CATEGORY_LABELS[item.category as PIICategory] ?? item.category}
                    </span>
                    <span className="text-gray-400">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {!stats?.top_categories?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Top platforms + users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sg-card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Top LLM platforms</h2>
          <div className="space-y-2">
            {(stats?.top_platforms ?? []).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 capitalize">{item.platform}</span>
                <span className="text-sm font-semibold text-gray-800">{item.count} events</span>
              </div>
            ))}
            {!stats?.top_platforms?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        <div className="sg-card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Most active users</h2>
          <div className="space-y-2">
            {(stats?.top_users ?? []).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-600 font-mono truncate max-w-[180px]">
                    {item.user_id.slice(0, 8)}...
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{item.count}</span>
              </div>
            ))}
            {!stats?.top_users?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className="sg-card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${colorMap[color] ?? colorMap.blue}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sg-card p-5 h-24 bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="sg-card p-5 h-64 bg-gray-100" />
        <div className="sg-card p-5 h-64 bg-gray-100" />
      </div>
    </div>
  )
}
