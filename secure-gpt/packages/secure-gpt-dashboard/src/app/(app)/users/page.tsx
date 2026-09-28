'use client'

import React, { useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button/button'
import { Shield, UserCheck, Download, Upload } from 'lucide-react'
import { UserBulkActionsBar } from './components/UserBulkActionsBar'
import { UserCsvImportModal } from './components/UserCsvImportModal'
import { UserModals } from './components/UserModals'
import { UserFilterToolbar } from './components/UserFilterToolbar'
import { UserTable } from './components/UserTable'
import { useUserManager } from './useUserManager'

export default function UsersPage() {
  const m = useUserManager()

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      m.setDebouncedSearch(m.search)
      m.setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [m.search, m.setDebouncedSearch, m.setPage])

  // Load static roles once
  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await fetch('/api/v1/admin/roles')
        const json = await response.json()
        if (json.success && Array.isArray(json.data)) {
          m.setRoles(json.data)
        }
      } catch {
        /* ignore role fetch error on initial load */
      }
    }
    void loadRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void m.loadUsers()
  }, [m.loadUsers])

  const allCurrentPageSelected = useMemo(() => {
    if (m.users.length === 0) return false
    return m.users.every((u) => m.selectedIds.includes(u.id))
  }, [m.users, m.selectedIds])

  const hasActiveFilters = Boolean(m.debouncedSearch || m.roleFilter || m.statusFilter !== 'all')

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
            onClick={m.handleExportCsv}
            title="Export filtered users as CSV"
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={<Upload size={14} />}
            onClick={() => m.setCsvImportOpen(true)}
            title="Bulk import user roster"
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<UserCheck size={14} />}
            onClick={() => m.setInviteOpen(true)}
          >
            Add Member
          </Button>
        </div>
      </div>

      <UserFilterToolbar
        search={m.search}
        setSearch={m.setSearch}
        roleFilter={m.roleFilter}
        setRoleFilter={m.setRoleFilter}
        statusFilter={m.statusFilter}
        setStatusFilter={m.setStatusFilter}
        roles={m.roles}
        onResetPage={() => m.setPage(1)}
      />

      <UserTable
        loading={m.loading}
        users={m.users}
        roles={m.roles}
        selectedIds={m.selectedIds}
        allCurrentPageSelected={allCurrentPageSelected}
        onToggleSelectAll={m.handleToggleSelectAll}
        onToggleSelectOne={m.handleToggleSelectOne}
        onOpenEditOrg={(u) => {
          m.setEditOrgUser(u)
          m.setOrgDraft(u.orgId || '')
        }}
        onOpenEditRoles={(u) => {
          m.setEditUser(u)
          m.setSelectedRoleSlugs(u.roles.map((r) => r.slug))
        }}
        onToggleStatus={m.handleToggleStatus}
        onDeleteUser={m.handleDeleteUser}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          m.setSearch('')
          m.setRoleFilter('')
          m.setStatusFilter('all')
          m.setPage(1)
        }}
        page={m.page}
        pageSize={m.pageSize}
        total={m.total}
        totalPages={m.totalPages}
        onPageChange={m.setPage}
        onPageSizeChange={(newSize) => {
          m.setPageSize(newSize)
          m.setPage(1)
        }}
      />

      <UserBulkActionsBar
        selectedCount={m.selectedIds.length}
        selectedUserIds={m.selectedIds}
        roles={m.roles}
        onClearSelection={() => m.setSelectedIds([])}
        onExecuteAction={m.handleExecuteBulkAction}
      />

      <UserCsvImportModal
        open={m.csvImportOpen}
        onClose={() => m.setCsvImportOpen(false)}
        onSuccess={() => void m.loadUsers()}
      />

      <UserModals
        editUser={m.editUser}
        onCloseEditRoles={() => m.setEditUser(null)}
        roles={m.roles}
        selectedRoleSlugs={m.selectedRoleSlugs}
        onToggleRoleSlug={(slug) =>
          m.setSelectedRoleSlugs((prev) =>
            prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
          )
        }
        savingRoles={m.savingRoles}
        onSaveRoles={m.handleSaveRoles}
        editOrgUser={m.editOrgUser}
        onCloseEditOrg={() => m.setEditOrgUser(null)}
        orgDraft={m.orgDraft}
        setOrgDraft={m.setOrgDraft}
        savingOrg={m.savingOrg}
        onSaveOrg={m.handleSaveOrg}
        inviteOpen={m.inviteOpen}
        onCloseInvite={() => m.setInviteOpen(false)}
        inviteEmail={m.inviteEmail}
        setInviteEmail={m.setInviteEmail}
        inviting={m.inviting}
        onInviteUser={m.handleInviteUser}
      />
    </div>
  )
}
