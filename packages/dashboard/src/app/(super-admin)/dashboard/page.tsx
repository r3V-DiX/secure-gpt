'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { Badge } from '@/components/ui/badge/badge'

interface PlatformStats {
  total_orgs: number
  total_users: number
  total_devices: number
  total_events: number
  active_orgs: number
}

interface OrgSummary {
  id: string
  name: string
  plan: string
  user_count: number
  event_count: number
  is_active: boolean
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [orgs, setOrgs] = useState<OrgSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch org list as proxy for platform stats
    apiClient.get('/users')
      .then((res) => {
        const data = res.data as { pagination: { total: number } }
        setStats({
          total_orgs: 1,
          total_users: data.pagination.total,
          total_devices: 0,
          total_events: 0,
          active_orgs: 1,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const PLAN_BADGE: Record<string, 'info' | 'warning' | 'success'> = {
    free: 'info', pro: 'warning', enterprise: 'success',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="sg-page-title">Platform Dashboard</h1>
        <p className="sg-page-subtitle">Global overview of SecureGPT across all organisations</p>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total orgs', value: stats?.total_orgs ?? '—', icon: '🏢', color: 'bg-purple-50 text-purple-700' },
          { label: 'Total users', value: stats?.total_users ?? '—', icon: '👥', color: 'bg-blue-50 text-blue-700' },
          { label: 'Active devices', value: stats?.total_devices ?? '—', icon: '💻', color: 'bg-green-50 text-green-700' },
          { label: 'Total events', value: stats?.total_events ?? '—', icon: '📊', color: 'bg-amber-50 text-amber-700' },
        ].map((card) => (
          <div key={card.label} className="sg-card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Organisations', desc: 'Manage all orgs and their plans', href: '/super-admin/organisations', icon: '🏢' },
          { title: 'Users', desc: 'View all users across all orgs', href: '/super-admin/users', icon: '👥' },
          { title: 'Billing', desc: 'Manage plans and subscriptions', href: '/super-admin/billing', icon: '💳' },
        ].map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="sg-card p-5 flex items-start gap-4 hover:border-blue-200 hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{card.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Platform notice */}
      <div className="sg-card p-4 bg-gray-900 border-gray-800">
        <p className="text-sm font-medium text-white mb-1">Super Admin access</p>
        <p className="text-xs text-gray-400">
          You have unrestricted access to all organisations, users, data, and platform settings.
          All actions are logged with your admin ID and timestamp.
        </p>
      </div>
    </div>
  )
}
