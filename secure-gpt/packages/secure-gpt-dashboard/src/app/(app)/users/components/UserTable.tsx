'use client'

import { Table, TableHead, TableRow, TableHeaderCell, Checkbox, TableBody, Select } from '@/components/ui'
import React from 'react'
import { Button } from '@/components/ui/button/button'
import { Loader2, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AdminUser, Role } from '@/types'
import { UserTableRow } from './UserTableRow'

interface UserTableProps {
  loading: boolean
  users: AdminUser[]
  roles: Role[]
  selectedIds: string[]
  allCurrentPageSelected: boolean
  onToggleSelectAll: () => void
  onToggleSelectOne: (id: string) => void
  onOpenEditOrg: (user: AdminUser) => void
  onOpenEditRoles: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => Promise<void>
  onDeleteUser: (user: AdminUser) => Promise<void>
  hasActiveFilters: boolean
  onClearFilters: () => void
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (newPage: number) => void
  onPageSizeChange: (newPageSize: number) => void
}

export function UserTable({
  loading,
  users,
  roles,
  selectedIds,
  allCurrentPageSelected,
  onToggleSelectAll,
  onToggleSelectOne,
  onOpenEditOrg,
  onOpenEditRoles,
  onToggleStatus,
  onDeleteUser,
  hasActiveFilters,
  onClearFilters,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md shadow-xl">
        <Loader2 className="animate-spin text-[var(--accent)] size-8" />
        <span className="text-sm text-[var(--text-tertiary)]">Loading user roster...</span>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md shadow-xl text-center space-y-3">
        <div className="size-12 rounded-md bg-[var(--bg-surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]">
          <Users size={24} />
        </div>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">No Users Found</h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm">
          {hasActiveFilters
            ? 'No user accounts match your search and filter criteria.'
            : 'No users exist in the system yet. Add members or import a CSV roster to get started.'}
        </p>
        {hasActiveFilters && (
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    )
  }

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endIdx = Math.min(page * pageSize, total)

  return (
    <div className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <TableHead>
            <TableRow className="border-b border-[var(--border-2)] bg-[var(--bg-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              <TableHeaderCell className="py-3 px-4 w-10 text-center">
                <Checkbox aria-label="Select item"

                  checked={allCurrentPageSelected}
                  onChange={onToggleSelectAll}

                  title="Select all on this page"
                />
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4">User</TableHeaderCell>
              <TableHeaderCell className="py-3 px-4">Active Status</TableHeaderCell>
              <TableHeaderCell className="py-3 px-4">Assigned Roles</TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-[var(--border-2)] text-[13px]">
            {users.map((u) => (
              <UserTableRow
                key={u.id}
                user={u}
                roles={roles}
                isSelected={selectedIds.includes(u.id)}
                onToggleSelect={onToggleSelectOne}
                onOpenEditOrg={onOpenEditOrg}
                onOpenEditRoles={onOpenEditRoles}
                onToggleStatus={onToggleStatus}
                onDeleteUser={onDeleteUser}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-[var(--border-2)] px-4 py-3 bg-[var(--bg-surface-2)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-[var(--text-primary)]">{startIdx}</strong> to{' '}
            <strong className="text-[var(--text-primary)]">{endIdx}</strong> of{' '}
            <strong className="text-[var(--text-primary)]">{total.toLocaleString()}</strong> users
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-[var(--text-tertiary)]">Rows:</span>
            <Select aria-label="20" wrapperClassName="w-auto min-w-0"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
              }}

            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronLeft size={14} />}
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <span className="text-xs font-mono px-2 text-[var(--text-tertiary)]">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronRight size={14} />}
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
