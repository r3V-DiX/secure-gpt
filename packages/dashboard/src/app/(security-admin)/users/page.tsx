'use client'

import { useUsers } from '@/features/users/hooks/use-users'
import { updateUserRole, deactivateUser } from '@/features/users/services/users.service'
import { DataTable, type Column } from '@/components/data-display/data-table'
import { Pagination } from '@/components/data-display/pagination'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { ROLE_LABELS } from '@securegpt/shared/constants'
import type { User } from '@securegpt/shared/types'
import type { UserRole } from '@securegpt/shared/constants'
import { useState } from 'react'

const ROLE_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'purple' | 'neutral'> = {
  SUPER_ADMIN: 'danger',
  SECURITY_ADMIN: 'warning',
  AUDITOR: 'info',
  HR_MANAGER: 'purple',
  USER: 'neutral',
}

export default function UsersPage() {
  const { data, pagination, loading, search, page, setPage, handleSearch, reload } = useUsers()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function handleRoleChange(userId: string, role: string) {
    setActionLoading(userId)
    try {
      await updateUserRole(userId, role)
      reload()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDeactivate(userId: string) {
    if (!confirm('Deactivate this user?')) return
    setActionLoading(userId)
    try {
      await deactivateUser(userId)
      reload()
    } finally {
      setActionLoading(null)
    }
  }

  const COLUMNS: Column<User>[] = [
    {
      key: 'user', label: 'User',
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.avatarUrl
            ? <img src={r.avatarUrl} alt={r.name} className="w-8 h-8 rounded-full flex-shrink-0" />
            : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">{r.name?.[0]?.toUpperCase()}</div>
          }
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
            <p className="text-xs text-gray-400 truncate">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', label: 'Role', width: '140px',
      render: (r) => (
        <select
          value={r.role}
          onChange={(e) => handleRoleChange(r.id, e.target.value)}
          disabled={actionLoading === r.id}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          {(['SUPER_ADMIN', 'SECURITY_ADMIN', 'AUDITOR', 'HR_MANAGER', 'USER'] as UserRole[]).map((role) => (
            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'department', label: 'Department', width: '140px',
      render: (r) => <span className="text-xs text-gray-500">{r.department ?? '—'}</span>,
    },
    {
      key: 'status', label: 'Status', width: '90px',
      render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'} dot>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'lastSeen', label: 'Last seen', width: '130px',
      render: (r) => <span className="text-xs text-gray-400">{r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleDateString() : 'Never'}</span>,
    },
    {
      key: 'actions', label: '', width: '80px',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          loading={actionLoading === r.id}
          onClick={() => handleDeactivate(r.id)}
        >
          Deactivate
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="sg-page-title">Users</h1>
        <p className="sg-page-subtitle">Manage users and their roles in your organisation</p>
      </div>

      <div className="sg-card p-4">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="sg-input max-w-sm"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        rowKey={(r) => r.id}
        emptyMessage="No users found"
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
