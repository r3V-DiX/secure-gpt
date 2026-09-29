'use client'
import { Checkbox } from '@/components/ui/input/selection'

import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui'
import React, { useState, useEffect } from 'react'
import {
  Users, Plus, Download, Upload,
  CheckSquare, Square, MinusSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { useToast } from '@/contexts/toast-context'
import { useDangerConfirm } from '@/components/ui/modal/modal'
import { EmptyState } from '@/components/ui/empty-state/EmptyState'
import { Pagination } from '@/components/data-display/pagination'
import { TeamFilters } from '@/features/team/hooks/use-team'
import { Pagination as PaginationType, Department, AuthUser } from '@/types'
import { TeamMemberRow } from './TeamMemberRow'
import { TeamFilterBar } from './TeamFilterBar'

interface TeamMemberTableProps {
  users: AuthUser[]
  departments: Department[]
  currentUser: AuthUser | null
  isOrgActive?: boolean
  loading?: boolean
  filters: TeamFilters
  pagination: PaginationType
  selectedIds: string[]
  onToggleSelect: (userId: string) => void
  onToggleSelectAll: () => void
  onOpenInvite: () => void
  onOpenCsvImport: () => void
  onExportCsv: () => void
  onUpdateFilters: (partial: Partial<TeamFilters>) => void
  onPageChange: (page: number) => void
  onChangeRole: (userId: string, role: string) => Promise<any>
  onAssignDepartment: (userId: string, deptId: string | null) => Promise<any>
  onDeleteUser: (userId: string) => Promise<any>
}

export function TeamMemberTable({
  users,
  departments,
  currentUser,
  isOrgActive = true,
  loading = false,
  filters,
  pagination,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenInvite,
  onOpenCsvImport,
  onExportCsv,
  onUpdateFilters,
  onPageChange,
  onChangeRole,
  onAssignDepartment,
  onDeleteUser,
}: TeamMemberTableProps) {
  const { toast } = useToast()
  const confirmDanger = useDangerConfirm()
  const [searchInput, setSearchInput] = useState(filters.search || '')

  // Debounced search input handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        onUpdateFilters({ search: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters.search, onUpdateFilters])

  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id))
  const someSelected = users.some((u) => selectedIds.includes(u.id)) && !allSelected

  const handleDeleteUser = async (u: AuthUser) => {
    const confirmed = await confirmDanger({
      title: `Terminate user ${u.email}?`,
      description: 'All active sessions and connected devices for this employee will be revoked immediately.',
      confirmLabel: 'Terminate User',
    })
    if (confirmed) {
      const res = await onDeleteUser(u.id)
      if (res.success) {
        toast.success(`User ${u.email} removed.`)
      } else {
        toast.error(res.error || 'Failed to remove user')
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Control Header & Top Actions ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
            <Users size={14} style={{ color: 'var(--success)' }} /> Enrolled Employees ({pagination.total.toLocaleString()})
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Enterprise roster under active browser DLP protection and policy enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportCsv}
            disabled={pagination.total === 0}
            className="gap-1.5 text-xs"
            title="Download CSV roster"
          >
            <Download size={13} /> Export CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenCsvImport}
            disabled={!isOrgActive}
            className="gap-1.5 text-xs"
            title="Bulk import employees via CSV"
          >
            <Upload size={13} /> Import CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenInvite}
            disabled={!isOrgActive}
            title={!isOrgActive ? 'Verify domain to invite employees' : undefined}
            className="gap-1 text-xs"
          >
            <Plus size={13} /> Invite Colleague
          </Button>
        </div>
      </div>

      {/* ── Enterprise Filter Bar ──────────────────────────────────── */}
      <TeamFilterBar
        searchInput={searchInput}
        filters={filters}
        departments={departments}
        onSearchChange={setSearchInput}
        onClearSearch={() => {
          setSearchInput('')
          onUpdateFilters({ search: '' })
        }}
        onUpdateFilters={onUpdateFilters}
      />

      {/* ── Team Table ─────────────────────────────────────────────── */}
      <div
        className="border rounded-md overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <Table className="w-full text-left text-[13px]">
          <TableHead
            className="border-b uppercase font-bold text-[11px] tracking-wider"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)',
            }}
          >
            <TableRow>
              <TableHeaderCell className="w-10 px-4 py-3 text-center">
                <Checkbox aria-label="Select all on current page" checked={allSelected} onChange={onToggleSelectAll} indeterminate={someSelected} disabled={users.length === 0} />
              </TableHeaderCell>
              <TableHeaderCell className="px-5 py-3">Employee Name & Email</TableHeaderCell>
              <TableHeaderCell className="px-5 py-3">Role</TableHeaderCell>
              <TableHeaderCell className="px-5 py-3">Assigned Category / Policy Tier</TableHeaderCell>
              <TableHeaderCell className="px-5 py-3">DLP Policy Status</TableHeaderCell>
              <TableHeaderCell className="px-5 py-3 text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="px-4 py-4 text-center">
                    <div className="skeleton size-4 rounded mx-auto" />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="skeleton h-3.5 w-48 rounded mb-1.5" />
                    <div className="skeleton h-2.5 w-32 rounded" />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="skeleton h-5 w-24 rounded" />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="skeleton h-5 w-36 rounded" />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="skeleton h-4 w-28 rounded" />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="skeleton size-6 rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-8">
                  <EmptyState
                    icon={Users}
                    title="No Employees Found"
                    description={
                      searchInput || filters.department_id || filters.role
                        ? 'No employees match your active filter criteria. Try clearing search or filters.'
                        : 'Invite team members or upload a CSV roster to enforce organization-wide DLP policies.'
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TeamMemberRow
                  key={u.id}
                  user={u}
                  currentUser={currentUser}
                  departments={departments}
                  isSelected={selectedIds.includes(u.id)}
                  onToggleSelect={onToggleSelect}
                  onChangeRole={onChangeRole}
                  onAssignDepartment={onAssignDepartment}
                  onDeleteClick={handleDeleteUser}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Server-Side Pagination Footer ──────────────────────────── */}
      {!loading && pagination.total > 0 && (
        <div className="pt-2">
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  )
}
