'use client'

import { useUsers } from '@/features/users/hooks/use-users'
import { DataTable, type Column } from '@/components/data-display/data-table'
import { Pagination } from '@/components/data-display/pagination'
import { Badge } from '@/components/ui/badge/badge'
import { ROLE_LABELS } from '@securegpt/shared/constants'
import type { User } from '@securegpt/shared/types'
import type { UserRole } from '@securegpt/shared/constants'

const ROLE_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'purple' | 'neutral'> = {
  SUPER_ADMIN: 'danger', SECURITY_ADMIN: 'warning', AUDITOR: 'info', HR_MANAGER: 'purple', USER: 'neutral',
}

const COLUMNS: Column<User>[] = [
  {
    key: 'user', label: 'User',
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
          {r.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
          <p className="text-xs text-gray-400 truncate">{r.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'role', label: 'Role', width: '140px',
    render: (r) => <Badge variant={ROLE_BADGE[r.role] ?? 'neutral'}>{ROLE_LABELS[r.role as UserRole] ?? r.role}</Badge>,
  },
  {
    key: 'org', label: 'Org ID', width: '120px',
    render: (r) => <span className="text-xs font-mono text-gray-400">{r.orgId.slice(0, 8)}...</span>,
  },
  {
    key: 'status', label: 'Status', width: '90px',
    render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'} dot>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
  },
  {
    key: 'lastSeen', label: 'Last seen', width: '120px',
    render: (r) => <span className="text-xs text-gray-400">{r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleDateString() : 'Never'}</span>,
  },
]

export default function SuperAdminUsersPage() {
  const { data, pagination, loading, search, page, setPage, handleSearch } = useUsers()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="sg-page-title">All Users</h1>
        <p className="sg-page-subtitle">Every user across all organisations</p>
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

      <DataTable columns={COLUMNS} data={data} loading={loading} rowKey={(r) => r.id} emptyMessage="No users found" />

      {pagination.total > 0 && (
        <Pagination page={pagination.page} totalPages={pagination.total_pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />
      )}
    </div>
  )
}
