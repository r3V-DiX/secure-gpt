'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { DataTable, type Column } from '@/components/data-display/data-table'
import { Pagination } from '@/components/data-display/pagination'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'

interface Device {
  id: string
  user_id: string
  os_platform: string
  browser: string
  extension_version: string
  is_active: boolean
  last_seen_at: string | null
  enrolled_at: string
}

interface DevicesResponse {
  data: Device[]
  pagination: { page: number; limit: number; total: number; total_pages: number }
}

export default function DevicesPage() {
  const [data, setData] = useState<Device[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [revoking, setRevoking] = useState<string | null>(null)

  async function load(p: number) {
    setLoading(true)
    try {
      const res = await apiClient.get('/devices', { params: { page: p, limit: 50 } })
      const d = res.data as DevicesResponse
      setData(d.data)
      setPagination(d.pagination)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load(page) }, [page])

  async function handleRevoke(deviceId: string) {
    if (!confirm('Revoke this device token? The extension will stop working on this device.')) return
    setRevoking(deviceId)
    try {
      await apiClient.delete(`/devices/${deviceId}`)
      void load(page)
    } finally {
      setRevoking(null)
    }
  }

  function getLastSeenStatus(lastSeen: string | null): { label: string; variant: 'success' | 'warning' | 'neutral' } {
    if (!lastSeen) return { label: 'Never', variant: 'neutral' }
    const diff = Date.now() - new Date(lastSeen).getTime()
    const hours = diff / 3600000
    if (hours < 1) return { label: 'Just now', variant: 'success' }
    if (hours < 24) return { label: `${Math.floor(hours)}h ago`, variant: 'success' }
    if (hours < 168) return { label: `${Math.floor(hours / 24)}d ago`, variant: 'warning' }
    return { label: `${Math.floor(hours / 168)}w ago`, variant: 'neutral' }
  }

  const COLUMNS: Column<Device>[] = [
    {
      key: 'device', label: 'Device',
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{r.browser}</p>
          <p className="text-xs text-gray-400">{r.os_platform}</p>
        </div>
      ),
    },
    {
      key: 'version', label: 'Extension', width: '110px',
      render: (r) => <span className="text-xs font-mono text-gray-600">v{r.extension_version}</span>,
    },
    {
      key: 'status', label: 'Status', width: '90px',
      render: (r) => <Badge variant={r.is_active ? 'success' : 'neutral'} dot>{r.is_active ? 'Active' : 'Revoked'}</Badge>,
    },
    {
      key: 'lastSeen', label: 'Last seen', width: '130px',
      render: (r) => {
        const s = getLastSeenStatus(r.last_seen_at)
        return <Badge variant={s.variant}>{s.label}</Badge>
      },
    },
    {
      key: 'enrolled', label: 'Enrolled', width: '120px',
      render: (r) => <span className="text-xs text-gray-400">{new Date(r.enrolled_at).toLocaleDateString()}</span>,
    },
    {
      key: 'actions', label: '', width: '80px',
      render: (r) => r.is_active ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          loading={revoking === r.id}
          onClick={() => handleRevoke(r.id)}
        >
          Revoke
        </Button>
      ) : null,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="sg-page-title">Devices</h1>
        <p className="sg-page-subtitle">All enrolled extension installations across your organisation</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="sg-card px-4 py-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">{pagination.total}</span>
          <span className="text-sm text-gray-500">total devices</span>
        </div>
        <div className="sg-card px-4 py-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-green-600">{data.filter((d) => d.is_active).length}</span>
          <span className="text-sm text-gray-500">active</span>
        </div>
      </div>

      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        rowKey={(r) => r.id}
        emptyMessage="No devices enrolled"
      />

      {pagination.total > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.total_pages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
