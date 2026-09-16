'use client'

import React, { useState, useEffect } from 'react'
import {
  Users, Plus, Trash2, Search, Filter, Download, Upload,
  CheckSquare, Square, MinusSquare, UserCheck, ShieldCheck, X
} from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { useToast } from '@/contexts/toast-context'
import { useDangerConfirm } from '@/components/ui/modal/modal'
import { EmptyState } from '@/components/ui/empty-state/EmptyState'
import { Pagination } from '@/components/data-display/pagination'
import { TeamFilters } from '@/features/team/hooks/use-team'
import { Pagination as PaginationType, Department, AuthUser } from '@/types'

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
      <div
        className="p-3 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center gap-3"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search employees by name or email (e.g. sarah, @acme)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full text-xs pl-8 pr-8 py-2 rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
            style={{ borderColor: 'var(--border-2)' }}
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                onUpdateFilters({ search: '' })
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-[var(--text-tertiary)] shrink-0" />
          <select
            value={filters.department_id || ''}
            onChange={(e) => onUpdateFilters({ department_id: e.target.value })}
            className="text-xs py-2 px-2.5 rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            style={{ borderColor: 'var(--border-2)' }}
          >
            <option value="">All Departments</option>
            <option value="unassigned">🏢 Unassigned Only</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                📁 {d.name} {d.members_count !== undefined ? `(${d.members_count})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={filters.role || ''}
            onChange={(e) => onUpdateFilters({ role: e.target.value })}
            className="text-xs py-2 px-2.5 rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            style={{ borderColor: 'var(--border-2)' }}
          >
            <option value="">All Roles</option>
            <option value="employee">EMPLOYEE</option>
            <option value="org_admin">ORG_ADMIN</option>
            <option value="user">USER</option>
          </select>
        </div>
      </div>

      {/* ── Team Table ─────────────────────────────────────────────── */}
      <div
        className="border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <table className="w-full text-left text-xs">
          <thead
            className="border-b uppercase font-bold tracking-wider"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface-2)',
              color: 'var(--text-tertiary)',
            }}
          >
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  disabled={users.length === 0}
                  className="p-1 rounded hover:bg-[var(--bg-surface-3)] transition-colors text-[var(--text-secondary)] disabled:opacity-30 cursor-pointer"
                  title="Select all on current page"
                >
                  {allSelected ? (
                    <CheckSquare size={15} className="text-[var(--accent)]" />
                  ) : someSelected ? (
                    <MinusSquare size={15} className="text-[var(--accent)]" />
                  ) : (
                    <Square size={15} />
                  )}
                </button>
              </th>
              <th className="px-5 py-3">Employee Name & Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Assigned Category / Policy Tier</th>
              <th className="px-5 py-3">DLP Policy Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4 text-center">
                    <div className="skeleton size-4 rounded mx-auto" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="skeleton h-3.5 w-48 rounded mb-1.5" />
                    <div className="skeleton h-2.5 w-32 rounded" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="skeleton h-5 w-24 rounded" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="skeleton h-5 w-36 rounded" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="skeleton h-4 w-28 rounded" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="skeleton size-6 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8">
                  <EmptyState
                    icon={Users}
                    title="No Employees Found"
                    description={
                      searchInput || filters.department_id || filters.role
                        ? 'No employees match your active filter criteria. Try clearing search or filters.'
                        : 'Invite team members or upload a CSV roster to enforce organization-wide DLP policies.'
                    }
                  />
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelected = selectedIds.includes(u.id)
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-[var(--accent-light)]/40' : 'hover:bg-[var(--bg-surface-2)]/60'
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleSelect(u.id)}
                        className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare size={15} className="text-[var(--accent)]" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <div
                        className="size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                      >
                        {u.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {u.fullName || u.email.split('@')[0]}
                        </p>
                        <p className="text-xs font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {u.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {currentUser?.role === 'org_admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_super_admin' ? (
                        <select
                          value={u.role}
                          onChange={(e) => onChangeRole(u.id, e.target.value)}
                          className="px-2 py-1 text-[11px] font-mono font-bold rounded-lg border bg-[var(--bg-surface-2)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                        >
                          <option value="employee">EMPLOYEE</option>
                          <option value="org_admin">ORG_ADMIN</option>
                          <option value="user">USER</option>
                        </select>
                      ) : (
                        <span
                          className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <select
                        value={u.departmentId || ''}
                        onChange={(e) => onAssignDepartment(u.id, e.target.value || null)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-[var(--bg-surface-2)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                      >
                        <option value="">🏢 General Org Policy</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            📁 {d.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Protection
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {u.id !== currentUser?.id ? (
                        <button
                          type="button"
                          onClick={async () => {
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
                          }}
                          className="p-1.5 rounded-lg border hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-slate-400 hover:text-red-600 cursor-pointer inline-flex items-center justify-center"
                          style={{ borderColor: 'var(--border-2)' }}
                          title="Terminate / Remove User"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] italic">You</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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

