import { useState, useCallback } from 'react'
import { apiGetPaginated, apiPut, apiPost, apiDelete } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import type { AdminUser, Role } from '@/types'

export function useUserManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [selectedRoleSlugs, setSelectedRoleSlugs] = useState<string[]>([])
  const [savingRoles, setSavingRoles] = useState(false)

  const [editOrgUser, setEditOrgUser] = useState<AdminUser | null>(null)
  const [orgDraft, setOrgDraft] = useState('')
  const [savingOrg, setSavingOrg] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const [csvImportOpen, setCsvImportOpen] = useState(false)

  const { toast } = useToast()

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
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user management data.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, roleFilter, statusFilter])

  const handleToggleSelectAll = () => {
    const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !users.some((u) => u.id === id)))
    } else {
      const currentPageIds = users.map((u) => u.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])))
    }
  }

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleExportCsv = () => {
    const params = new URLSearchParams()
    if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim())
    if (roleFilter) params.append('role', roleFilter)
    if (statusFilter === 'active') params.append('is_active', 'true')
    if (statusFilter === 'suspended') params.append('is_active', 'false')

    window.open(`/api/v1/admin/users/export-csv?${params.toString()}`, '_blank')
  }

  const handleExecuteBulkAction = async (
    action: string,
    params?: { orgId?: string; roleSlugs?: string[] }
  ) => {
    try {
      const json = await apiPost<{ affected: number; action: string }>('/admin/users/bulk', {
        user_ids: selectedIds,
        action,
        org_id: params?.orgId,
        role_slugs: params?.roleSlugs,
      })
      toast.success(`Bulk action '${action}' successfully applied to ${json.affected} user(s).`)
      setSelectedIds([])
      await loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Error executing bulk operation.')
    }
  }

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
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: response.isActive } : u))
      )
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status.')
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `⚠️ PERMANENT ACTION:\nAre you sure you want to PERMANENTLY delete user ${user.fullName || user.email}?\nAll active sessions, devices, and permissions will be destroyed immediately.`
    )
    if (!confirmed) return

    try {
      await apiDelete(`/admin/users/${user.id}`)
      toast.success(`User ${user.fullName || user.email} has been permanently deleted.`)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setTotal((prev) => Math.max(0, prev - 1))
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user.')
    }
  }

  async function handleSaveRoles() {
    if (!editUser) return
    try {
      setSavingRoles(true)
      await apiPut(`/admin/users/${editUser.id}/roles`, { roleSlugs: selectedRoleSlugs })
      toast.success(`Roles updated for ${editUser.fullName || editUser.email}`)
      const updatedRoles = roles.filter((r) => selectedRoleSlugs.includes(r.slug))
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, roles: updatedRoles } : u))
      )
      setEditUser(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update roles.')
    } finally {
      setSavingRoles(false)
    }
  }

  async function handleSaveOrg() {
    if (!editOrgUser) return
    try {
      setSavingOrg(true)
      const targetOrg = orgDraft.trim() || null
      await apiPut(`/admin/users/${editOrgUser.id}/org`, { orgId: targetOrg })
      toast.success(`Organization updated for ${editOrgUser.fullName || editOrgUser.email}`)
      setUsers((prev) =>
        prev.map((u) => (u.id === editOrgUser.id ? { ...u, orgId: targetOrg } : u))
      )
      setEditOrgUser(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update organization.')
    } finally {
      setSavingOrg(false)
    }
  }

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

  return {
    users,
    setUsers,
    roles,
    setRoles,
    loading,
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    selectedIds,
    setSelectedIds,
    editUser,
    setEditUser,
    selectedRoleSlugs,
    setSelectedRoleSlugs,
    savingRoles,
    editOrgUser,
    setEditOrgUser,
    orgDraft,
    setOrgDraft,
    savingOrg,
    inviteOpen,
    setInviteOpen,
    inviteEmail,
    setInviteEmail,
    inviting,
    csvImportOpen,
    setCsvImportOpen,
    loadUsers,
    handleToggleSelectAll,
    handleToggleSelectOne,
    handleExportCsv,
    handleExecuteBulkAction,
    handleToggleStatus,
    handleDeleteUser,
    handleSaveRoles,
    handleSaveOrg,
    handleInviteUser,
  }
}
