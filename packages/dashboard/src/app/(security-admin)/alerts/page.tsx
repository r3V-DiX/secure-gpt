'use client'

import { useEffect, useState } from 'react'
import { fetchHighRiskUsers, type HighRiskUser } from '@/features/users/services/users.service'
import { Button } from '@/components/ui/button/button'
import { Badge } from '@/components/ui/badge/badge'
import apiClient from '@/lib/api/client'

export default function AlertsPage() {
  const [users, setUsers] = useState<HighRiskUser[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)

  useEffect(() => {
    fetchHighRiskUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  async function triggerCheck() {
    setTriggering(true)
    try {
      await apiClient.post('/alerts/trigger-check')
      const updated = await fetchHighRiskUsers()
      setUsers(updated)
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="sg-page-title">High-Risk Alerts</h1>
          <p className="sg-page-subtitle">Users who exceeded the block threshold in the past 7 days</p>
        </div>
        <Button variant="secondary" size="sm" loading={triggering} onClick={triggerCheck}>
          Run check now
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sg-card p-5 h-20 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="sg-card p-12 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">✅</span>
          <h2 className="font-semibold text-gray-800">No high-risk users</h2>
          <p className="text-sm text-gray-500">No users have exceeded the block threshold in the current window.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="danger" dot>{users.length} user{users.length !== 1 ? 's' : ''} flagged</Badge>
          </div>
          {users.map((user) => (
            <div key={user.user_id} className="sg-card p-5 border-l-4 border-red-400">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.department && (
                      <p className="text-xs text-gray-400 mt-0.5">{user.department}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-red-600">{user.block_count}</p>
                  <p className="text-xs text-gray-400">blocks in {user.window_days} days</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
