'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { apiGetPaginated, apiPut, apiPost, apiDelete } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import {
  Shield,
  UserMinus,
  UserCheck,
  ShieldAlert,
  Loader2,
  Edit3,
  Trash2,
  Search,
  X,
  Filter,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import type { AdminUser, Role } from '@/types'
import { UserBulkActionsBar } from './components/UserBulkActionsBar'
import { UserCsvImportModal } from './components/UserCsvImportModal'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal Edit Roles state
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [selectedRoleSlugs, setSelectedRoleSlugs] = useState<string[]>([])
  const [savingRoles, setSavingRoles] = useState(false)

  // Modal Edit Org state
  const [editOrgUser, setEditOrgUser] = useState<AdminUser | null>(null)
  const [orgDraft, setOrgDraft] = useState('')
  const [savingOrg, setSavingOrg] = useState(false)

  // Modal Invite state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  // Modal CSV Import state
  const [csvImportOpen, setCsvImportOpen] = useState(false)

  const { toast } = useToast()

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  // Load static roles once
  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await fetch('/api/v1/admin/roles')
        const json = await response.json()
        if (json.success && Array.isArray(json.data)) {
          setRoles(json.data)
        }
      } catch {
        /* ignore role fetch error on initial load */
      }
    }
    void loadRoles()
  }, [])

  // Load paginated users data
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      }
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      if (roleFilter) params.role = roleFilter
      if (statusFilter === 'active') params.is_active = true
      if (statusFilter === 'suspended') params.is_active = false

      const result = await apiGetPaginated<AdminUser>('/admin/users', params)
      setUsers(result.data ?? [])
      setTotal(result.pagination?.total ?? (result.data?.length || 0))
      setTotalPages(result.pagination?.total_pages ?? (Math.ceil((result.data?.length || 0) / pageSize) || 1))
      // Clear selection on page or filter change
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user management data.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, roleFilter, statusFilter])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  // Select all toggles on current page
  const allCurrentPageSelected = useMemo(() => {
    if (users.length === 0) return false
    return users.every(u => selectedIds.includes(u.id))
  }, [users, selectedIds])

  const handleToggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedIds(prev => prev.filter(id => !users.some(u => u.id === id)))
    } else {
      const currentPageIds = users.map(u => u.id)
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])))
    }
  }

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Export CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams()
    if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim())
    if (roleFilter) params.append('role', roleFilter)
    if (statusFilter === 'active') params.append('is_active', 'true')
    if (statusFilter === 'suspended') params.append('is_active', 'false')

    window.open(`/api/v1/admin/users/export-csv?${params.toString()}`, '_blank')
  }

  // Bulk action dispatcher
  const handleExecuteBulkAction = async (
    action: string,
    params?: { orgId?: string; roleSlugs?: string[] }
  ) => {
    try {
      const response = await fetch('/api/v1/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_ids: selectedIds,
          action,
          org_id: params?.orgId,
          role_slugs: params?.roleSlugs,
        }),
      })
      const json = await response.json()
      if (json.success) {
        toast.success(json.message || `Bulk action '${action}' succeeded.`)
        setSelectedIds([])
        await loadUsers()
      } else {
        toast.error(json.error?.message || `Failed to execute bulk action '${action}'.`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing bulk operation.')
    }
  }

  // Toggle single user suspension
  async function handleToggleStatus(user: AdminUser) {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to ${user.isActive ? 'suspend' : 'activate'} the account of ${user.fullName || user.email}?`
      )
      if (!confirmed) return

      const response = await apiPut<{ isActive: boolean }>(`/admin/users/${user.id}/status`)
      toast.success(
        `Account of ${user.fullName || user.email} has been ${response.isActive ? 'activated' : 'suspended'}.`
      )
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, isActive: response.isActive } : u))
      )
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status.')
    }
  }

  // Delete single user permanently
  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `⚠️ PERMANENT ACTION:\nAre you sure you want to PERMANENTLY delete user ${user.fullName || user.email}?\nAll active sessions, devices, and permissions will be destroyed immediately.`
    )
    if (!confirmed) return

    try {
      await apiDelete(`/admin/users/${user.id}`)
      toast.success(`User ${user.fullName || user.email} has been permanently deleted.`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setTotal(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user.')
    }
  }

  // Open edit roles modal
  function handleOpenEditRoles(user: AdminUser) {
    setEditUser(user)
    setSelectedRoleSlugs(user.roles.map(r => r.slug))
  }

  // Open edit org modal
  function handleOpenEditOrg(user: AdminUser) {
    setEditOrgUser(user)
    setOrgDraft(user.orgId || '')
  }

  // Handle role checkbox toggles
  function handleToggleRoleSlug(slug: string) {
    setSelectedRoleSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  // Submit role updates
  async function handleSaveRoles() {
    if (!editUser) return
    try {
      setSavingRoles(true)
      await apiPut(`/admin/users/${editUser.id}/roles`, { roleSlugs: selectedRoleSlugs })
      toast.success(`Roles updated for ${editUser.fullName || editUser.email}`)
      
      const updatedRoles = roles.filter(r => selectedRoleSlugs.includes(r.slug))
      setUsers(prev =>
        prev.map(u => (u.id === editUser.id ? { ...u, roles: updatedRoles } : u))
      )
      setEditUser(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update roles.')
    } finally {
      setSavingRoles(false)
    }
  }

  // Submit organization updates
  async function handleSaveOrg() {
    if (!editOrgUser) return
    try {
      setSavingOrg(true)
      const targetOrg = orgDraft.trim() || null
      await apiPut(`/admin/users/${editOrgUser.id}/org`, { orgId: targetOrg })
      toast.success(`Organization updated for ${editOrgUser.fullName || editOrgUser.email}`)
      
      setUsers(prev =>
        prev.map(u => (u.id === editOrgUser.id ? { ...u, orgId: targetOrg } : u))
      )
      setEditOrgUser(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update organization.')
    } finally {
      setSavingOrg(false)
    }
  }

  // Handle invite
  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      setInviting(true)
      await apiPost('/admin/users/invite', { email: inviteEmail.trim() })
      toast.success('User invited successfully!')
      setInviteOpen(false)
      setInviteEmail('')
      await loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite user.')
    } finally {
      setInviting(false)
    }
  }

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endIdx = Math.min(page * pageSize, total)

  return (
    <div className="flex-1 space-y-6 w-full animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
            <Shield className="text-[var(--accent)] size-5 shrink-0" />
            User Management (RBAC)
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Control dynamic role assignments, view active users, and manage account statuses across all organizations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            icon={<Download size={14} />}
            onClick={handleExportCsv}
            title="Export filtered users as CSV"
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={<Upload size={14} />}
            onClick={() => setCsvImportOpen(true)}
            title="Bulk import user roster"
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<UserCheck size={14} />}
            onClick={() => setInviteOpen(true)}
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* Enterprise Search & Filter Toolbar */}
      <div className="p-3.5 rounded-md border border-[var(--border-2)] bg-[var(--bg-surface)] flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by name, email, or org..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] whitespace-nowrap font-medium">
            <Filter size={12} />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="px-2.5 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent)]"
          >
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.slug}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any)
              setPage(1)
            }}
            className="px-2.5 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent)]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md shadow-xl">
          <Loader2 className="animate-spin text-[var(--accent)] size-8" />
          <span className="text-sm text-[var(--text-tertiary)]">Loading user roster...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md shadow-xl text-center space-y-3">
          <div className="size-12 rounded-md bg-[var(--bg-surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]">
            <Users size={24} />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">No Users Found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm">
            {debouncedSearch || roleFilter || statusFilter !== 'all'
              ? 'No user accounts match your search and filter criteria.'
              : 'No users exist in the system yet. Add members or import a CSV roster to get started.'}
          </p>
          {(debouncedSearch || roleFilter || statusFilter !== 'all') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('')
                setRoleFilter('')
                setStatusFilter('all')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-2)] bg-[var(--bg-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-[var(--border-2)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)] size-4 cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Active Status</th>
                  <th className="py-3 px-4">Assigned Roles</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-2)] text-[13px]">
                {users.map(u => {
                  const isSelected = selectedIds.includes(u.id)
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${isSelected ? 'bg-[var(--accent-light)]/40' : 'hover:bg-white/5'}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(u.id)}
                          className="rounded border-[var(--border-2)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)] size-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <Avatar src={u.avatarUrl} name={u.fullName} email={u.email} size="md" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate text-[var(--text-primary)]">
                            {u.fullName || 'No Name'}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                            <span className="text-[var(--text-tertiary)]">{u.email}</span>
                            {u.orgId && (
                              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 py-0.5 rounded font-mono">
                                org: {u.orgId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <Badge variant="success" dot>Active</Badge>
                        ) : (
                          <Badge variant="danger" dot>Suspended</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map(r => {
                              const fullRole = roles.find(x => x.slug === r.slug)
                              const permsList = fullRole?.permissions?.map(p => p.action).join(', ') || 'No permissions'
                              return (
                                <Badge
                                  key={r.id}
                                  variant={r.slug === 'super_admin' ? 'purple' : 'info'}
                                  title={`Permissions: ${permsList}`}
                                >
                                  {r.name}
                                </Badge>
                              )
                            })
                          ) : (
                            <span className="italic text-[11px] text-[var(--text-tertiary)] opacity-70">No roles assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Edit3 size={12} />}
                            onClick={() => handleOpenEditOrg(u)}
                          >
                            Org
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Edit3 size={12} />}
                            onClick={() => handleOpenEditRoles(u)}
                          >
                            Roles
                          </Button>
                          <Button
                            variant={u.isActive ? 'danger' : 'primary'}
                            size="sm"
                            icon={u.isActive ? <UserMinus size={12} /> : <UserCheck size={12} />}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={12} />}
                            onClick={() => handleDeleteUser(u)}
                            title="Permanently Hard Delete User"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="px-2 py-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<ChevronLeft size={14} />}
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
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
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <UserBulkActionsBar
        selectedCount={selectedIds.length}
        selectedUserIds={selectedIds}
        roles={roles}
        onClearSelection={() => setSelectedIds([])}
        onExecuteAction={handleExecuteBulkAction}
      />

      {/* CSV Import Modal */}
      <UserCsvImportModal
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        onSuccess={() => void loadUsers()}
      />

      {/* Edit Roles Modal */}
      {editUser && (
        <Modal open={!!editUser} onClose={() => setEditUser(null)} size="md">
          <ModalHeader onClose={() => setEditUser(null)}>
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-[var(--accent)] size-5 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Modify Security Roles</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">{editUser.email}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Select the roles you wish to grant to this user. Roles accumulate permissions dynamically.
              </p>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {roles.map(role => {
                  const checked = selectedRoleSlugs.includes(role.slug)
                  return (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-2)] bg-[var(--bg-surface-2)] cursor-pointer hover:border-white/20 transition-all select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleRoleSlug(role.slug)}
                        className="mt-1 rounded border-[var(--border-2)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)] size-4 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold flex items-center gap-1.5 text-[var(--text-primary)]">
                          {role.name}
                          {role.isSystem && (
                            <span className="text-[9px] bg-[var(--bg-base)] border border-[var(--border)] px-1 py-0.5 rounded uppercase text-[var(--text-tertiary)]">
                              System
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] mt-0.5 text-[var(--text-tertiary)]">
                          {role.description || 'No description available.'}
                        </span>
                        {role.permissions && role.permissions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {role.permissions.map(p => (
                              <span
                                key={p.id}
                                className="text-[9px] px-1.5 py-0.5 rounded border font-mono bg-[var(--bg-surface-3)] border-[var(--border)] text-[var(--text-secondary)]"
                                title={p.description || ''}
                              >
                                {p.action}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={savingRoles}
              onClick={handleSaveRoles}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Edit Org Modal */}
      {editOrgUser && (
        <Modal open={!!editOrgUser} onClose={() => setEditOrgUser(null)} size="sm">
          <ModalHeader onClose={() => setEditOrgUser(null)}>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Update Organization Assignment</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">{editOrgUser.email}</p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Assign this user to an organization ID. All users with the same organization ID will share the same DLP policies. Leave blank to unassign.
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold block text-[var(--text-secondary)]">Organization ID</label>
                <input
                  type="text"
                  placeholder="e.g. rivedix"
                  value={orgDraft}
                  onChange={(e) => setOrgDraft(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-sm outline-none focus:border-white/20"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={() => setEditOrgUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={savingOrg}
              onClick={handleSaveOrg}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Invite Member Modal */}
      {inviteOpen && (
        <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} size="sm">
          <form onSubmit={handleInviteUser}>
            <ModalHeader onClose={() => setInviteOpen(false)}>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Invite Team Member</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">Add a new user to your organization</p>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-[12px] text-[var(--text-secondary)]">
                  Enter the email address of the person you want to invite.
                </p>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold block text-[var(--text-secondary)]">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-sm outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button type="button" variant="ghost" size="md" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={inviting}
              >
                Send Invite
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}

