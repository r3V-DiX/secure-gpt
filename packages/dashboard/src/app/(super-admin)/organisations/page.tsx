'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { Badge } from '@/components/ui/badge/badge'

interface Org {
  id: string
  name: string
  admin_email: string
  plan: string
  is_active: boolean
  created_at: string
}

export default function OrganisationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now use the current user's org as placeholder
    // In production this would be a super-admin-only endpoint
    apiClient.get('/auth/me')
      .then((res) => {
        const user = (res.data as { data: { orgId: string } }).data
        setOrgs([{ id: user.orgId, name: 'Current Org', admin_email: '', plan: 'pro', is_active: true, created_at: new Date().toISOString() }])
      })
      .finally(() => setLoading(false))
  }, [])

  const PLAN_BADGE: Record<string, 'info' | 'warning' | 'success'> = {
    free: 'info', pro: 'warning', enterprise: 'success',
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="sg-page-title">Organisations</h1>
        <p className="sg-page-subtitle">All organisations using SecureGPT</p>
      </div>

      <div className="sg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Organisation', 'Admin email', 'Plan', 'Status', 'Created'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : orgs.map((org) => (
              <tr key={org.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{org.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{org.id.slice(0, 8)}...</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{org.admin_email || '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={PLAN_BADGE[org.plan] ?? 'neutral'} className="capitalize">{org.plan}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={org.is_active ? 'success' : 'neutral'} dot>{org.is_active ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(org.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
