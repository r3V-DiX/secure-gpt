'use client'

import { useEffect, useState } from 'react'
import { fetchMyLogs } from '@/features/event-log/services/event-log.service'
import { fetchLogStats } from '@/features/event-log/services/event-log.service'
import { Badge } from '@/components/ui/badge/badge'
import { PII_CATEGORY_LABELS } from '@securegpt/shared/constants'
import type { AuditLog } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'
import { useAuth } from '@/features/auth/hooks/use-auth'

const ACTION_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
  BLOCK: 'danger', MASK: 'warning', WARN_ALLOW: 'info', ALLOW: 'success',
}

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState({ blocked: 0, masked: 0, warned: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchMyLogs({ page: 1, limit: 10 }),
    ]).then(([logsRes]) => {
      setRecentLogs(logsRes.data)
      const blocked = logsRes.data.filter((l) => l.actionTaken === 'BLOCK').length
      const masked = logsRes.data.filter((l) => l.actionTaken === 'MASK').length
      const warned = logsRes.data.filter((l) => l.actionTaken === 'WARN_ALLOW').length
      setStats({ blocked, masked, warned })
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="sg-page-title">Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>
        <p className="sg-page-subtitle">Your personal data protection summary</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Blocked', value: stats.blocked, color: 'bg-red-50 text-red-700', icon: '🚫' },
          { label: 'Masked', value: stats.masked, color: 'bg-amber-50 text-amber-700', icon: '🎭' },
          { label: 'Warned', value: stats.warned, color: 'bg-orange-50 text-orange-700', icon: '⚠️' },
        ].map((s) => (
          <div key={s.label} className={`sg-card p-5 flex items-center gap-3 ${s.color}`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs opacity-80">{s.label} (recent)</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="sg-card p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Recent activity</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="py-10 text-center">
            <span className="text-3xl">🛡️</span>
            <p className="text-sm text-gray-400 mt-2">No activity yet. SecureGPT is watching.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.eventId} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant={ACTION_BADGE[log.actionTaken] ?? 'neutral'}>{log.actionTaken}</Badge>
                  <span className="text-sm text-gray-700 truncate">
                    {PII_CATEGORY_LABELS[log.categoryTriggered as PIICategory] ?? log.categoryTriggered}
                  </span>
                  <span className="text-xs text-gray-400 truncate hidden sm:block">on {log.llmPlatform}</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Protection status card */}
      <div className="sg-card p-5 bg-green-50 border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">✅</div>
          <div>
            <p className="font-semibold text-green-800">SecureGPT is protecting you</p>
            <p className="text-sm text-green-700 mt-0.5">
              Your extension is active and monitoring all configured AI platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
