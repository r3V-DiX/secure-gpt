'use client'

import React, { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Button } from '@/components/ui/button/button'
import { Shield, Plus, Loader2 } from 'lucide-react'
import type { Role, Permission } from '@/types'
import { RoleCard } from './components/RoleCard'
import { RoleFormModals } from './components/RoleFormModals'
import { ManagePermissionsModal } from './components/ManagePermissionsModal'

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Modal States
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Role | null>(null)
  const [manageTarget, setManageTarget] = useState<Role | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  // Local Form States
  const [roleName, setRoleName] = useState('')
  const [roleSlug, setRoleSlug] = useState('')
  const [roleDesc, setRoleDesc] = useState('')
  const [roleActive, setRoleActive] = useState(true)

  // Manage permissions selection
  const [selectedPermActions, setSelectedPermActions] = useState<Set<string>>(new Set())
  const [permSearch, setPermSearch] = useState('')
  const [permModule, setPermModule] = useState('all')

  async function loadData() {
    try {
      setLoading(true)
      const [rolesData, permsData] = await Promise.all([
        apiGet<Role[]>('/admin/roles'),
        apiGet<Permission[]>('/admin/permissions')
      ])
      setRoles(rolesData)
      setPermissions(permsData)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load Roles & Permissions configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const autoSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  }

  // Create Role Handlers
  function openCreateModal() {
    setRoleName('')
    setRoleSlug('')
    setRoleDesc('')
    setShowCreate(true)
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!roleName || !roleSlug) return
    try {
      setSubmitting(true)
      await apiPost('/admin/roles', {
        name: roleName,
        slug: roleSlug,
        description: roleDesc
      })
      toast.success(`Role "${roleName}" created successfully!`)
      setShowCreate(false)
      void loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create role.')
    } finally {
      setSubmitting(false)
    }
  }

  // Edit Role Handlers
  function openEditModal(role: Role) {
    setEditTarget(role)
    setRoleName(role.name)
    setRoleDesc(role.description || '')
    setRoleActive(role.isActive)
  }

  async function handleEditRole(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget || !roleName) return
    try {
      setSubmitting(true)
      await apiPut(`/admin/roles/${editTarget.id}`, {
        name: roleName,
        description: roleDesc,
        isActive: roleActive
      })
      toast.success('Role updated successfully!')
      setEditTarget(null)
      void loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role.')
    } finally {
      setSubmitting(false)
    }
  }

  // Manage Permissions Handlers
  function openManagePermissions(role: Role) {
    setManageTarget(role)
    setSelectedPermActions(new Set(role.permissions.map(p => p.action)))
    setPermSearch('')
    setPermModule('all')
  }

  const togglePermissionSelection = (action: string) => {
    setSelectedPermActions(prev => {
      const next = new Set(prev)
      if (next.has(action)) next.delete(action)
      else next.add(action)
      return next
    })
  }

  async function handleSavePermissions() {
    if (!manageTarget) return
    try {
      setSubmitting(true)
      await apiPut(`/admin/roles/${manageTarget.id}/permissions`, {
        permissionActions: Array.from(selectedPermActions)
      })
      toast.success(`Permissions updated for role "${manageTarget.name}".`)
      setManageTarget(null)
      void loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update permissions.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Role Handlers
  async function handleDeleteRole() {
    if (!deleteTarget) return
    try {
      setSubmitting(true)
      await apiDelete(`/admin/roles/${deleteTarget.id}`)
      toast.success('Role deleted successfully!')
      setDeleteTarget(null)
      void loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 w-full animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
            <Shield className="text-[var(--accent)] size-5 shrink-0" />
            Security Roles
          </h1>
          <p className="text-sm mt-1 text-[var(--text-secondary)]">
            Configure Dynamic Security Roles, assign custom granular permissions, and control user scopes.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={13} />} onClick={openCreateModal}>
          New Role
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[var(--accent)] size-8" />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading system roles...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              isExpanded={expanded.has(role.id)}
              onToggleExpand={toggleExpand}
              onOpenManagePermissions={openManagePermissions}
              onOpenEdit={openEditModal}
              onOpenDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Form Modals (Create, Edit, Delete) */}
      <RoleFormModals
        showCreate={showCreate}
        onCloseCreate={() => setShowCreate(false)}
        handleCreateRole={handleCreateRole}
        roleName={roleName}
        setRoleName={setRoleName}
        roleSlug={roleSlug}
        setRoleSlug={setRoleSlug}
        roleDesc={roleDesc}
        setRoleDesc={setRoleDesc}
        autoSlug={autoSlug}
        submitting={submitting}
        editTarget={editTarget}
        onCloseEdit={() => setEditTarget(null)}
        handleEditRole={handleEditRole}
        roleActive={roleActive}
        setRoleActive={setRoleActive}
        deleteTarget={deleteTarget}
        onCloseDelete={() => setDeleteTarget(null)}
        handleDeleteRole={handleDeleteRole}
      />

      {/* Permissions Modal */}
      <ManagePermissionsModal
        manageTarget={manageTarget}
        onClose={() => setManageTarget(null)}
        permissions={permissions}
        selectedPermActions={selectedPermActions}
        togglePermissionSelection={togglePermissionSelection}
        setSelectedPermActions={setSelectedPermActions}
        permSearch={permSearch}
        setPermSearch={setPermSearch}
        permModule={permModule}
        setPermModule={setPermModule}
        submitting={submitting}
        onSave={handleSavePermissions}
      />
    </div>
  )
}
