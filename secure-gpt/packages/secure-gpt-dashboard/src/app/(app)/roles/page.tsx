'use client'

import React, { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Button } from '@/components/ui/button/button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import { Badge } from '@/components/ui/badge/badge'
import {
  Shield, Plus, Edit, Trash2, Check, X, Users,
  Lock, ChevronDown, ChevronRight, Search, Info, Settings, AlertTriangle, Loader2
} from 'lucide-react'
import type { Role, Permission } from '@/types'

const MODULE_COLORS: Record<string, string> = {
  USER: 'var(--accent)',
  POLICY: 'var(--success)',
  SYSTEM: 'var(--text-secondary)',
  AUDIT: 'var(--warning)',
  ROLE: 'var(--accent)',
  ORGANISATION: 'var(--info)'
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Expanded roles lists
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

  // Permission selection logic modules
  const modules = Array.from(new Set(permissions.map(p => p.module)))
  const filteredPermissions = permissions.filter(p => {
    const matchesSearch =
      !permSearch ||
      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.action.toLowerCase().includes(permSearch.toLowerCase())
    const matchesModule = permModule === 'all' || p.module === permModule
    return matchesSearch && matchesModule
  })

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
          {roles.map(role => {
            const isExpanded = expanded.has(role.id)
            const userCount = (role as any).userCount ?? 0
            const canDelete = !role.isSystem && userCount === 0

            return (
              <div
                key={role.id}
                className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md overflow-hidden shadow-lg transition-all"
                style={{ opacity: role.isActive ? 1 : 0.65 }}
              >
                {/* Main Row */}
                <div className="flex items-center gap-3 px-5 py-4 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => toggleExpand(role.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                    ) : (
                      <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>

                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: role.isSystem ? 'rgba(239, 68, 68, 0.1)' : 'rgba(129, 140, 248, 0.1)' }}
                  >
                    <Shield size={15} className={role.isSystem ? 'text-red-400' : 'text-[var(--accent)]'} />
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{role.name}</span>
                      <code className="text-[10px] bg-[var(--bg-surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono text-[var(--text-tertiary)]">
                        {role.slug}
                      </code>
                      {role.isSystem && (
                        <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1">
                          <Lock size={8} /> System
                        </span>
                      )}
                      {!role.isActive && (
                        <span className="text-[9px] bg-white/5 border border-white/10 text-[var(--text-tertiary)] px-1.5 py-0.5 rounded uppercase font-bold">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {role.description || 'No description available.'}
                    </p>
                  </div>

                  {/* Metadata and Actions */}
                  <div className="flex items-center gap-3 shrink-0 ml-auto">
                    <div className="text-right hidden md:block mr-2">
                      <span className="text-[12px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>
                        {role.permissions?.length ?? 0} permissions
                      </span>
                      <span className="text-[11px] block flex items-center gap-1 justify-end" style={{ color: 'var(--text-tertiary)' }}>
                        <Users size={10} /> {userCount} users
                      </span>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Settings size={12} />}
                      onClick={() => openManagePermissions(role)}
                    >
                      Permissions
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Edit size={12} />}
                      onClick={() => openEditModal(role)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={12} />}
                      disabled={!canDelete}
                      onClick={() => setDeleteTarget(role)}
                      title={role.isSystem ? 'System roles cannot be deleted' : userCount > 0 ? 'Assigned to active users' : 'Delete Role'}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded Permissions Detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--border-2)] bg-[var(--bg-surface-2)]">
                    <div className="px-5 py-2.5 flex items-center justify-between border-b border-[var(--border-2)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Assigned Permissions ({role.permissions?.length ?? 0})
                      </span>
                    </div>
                    <div className="p-5">
                      {!role.permissions?.length ? (
                        <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>No permissions assigned to this role.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {role.permissions.map(perm => {
                            const color = MODULE_COLORS[perm.module] ?? 'var(--accent)'
                            return (
                              <div
                                key={perm.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--border-2)] text-xs font-semibold"
                                style={{ background: 'var(--bg-surface)' }}
                              >
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                                  style={{ background: `${color}15`, color }}
                                >
                                  {perm.module}
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}>{perm.name}</span>
                                <code className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                  ({perm.action})
                                </code>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── CREATE ROLE MODAL ── */}
      {showCreate && (
        <Modal open={showCreate} onClose={() => setShowCreate(false)} size="md">
          <form onSubmit={handleCreateRole}>
            <ModalHeader onClose={() => setShowCreate(false)}>
              <div className="flex items-center gap-2">
                <Shield className="text-[var(--accent)] size-5 shrink-0" />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Create Custom Role</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Role Name
                  </label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={e => {
                      setRoleName(e.target.value)
                      setRoleSlug(autoSlug(e.target.value))
                    }}
                    placeholder="e.g. Senior Security Auditor"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-white focus:ring-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Slug Identification (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={roleSlug}
                    onChange={e => setRoleSlug(e.target.value)}
                    placeholder="senior_security_auditor"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-white focus:ring-[var(--accent)] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={roleDesc}
                    onChange={e => setRoleDesc(e.target.value)}
                    placeholder="Provide a description of the scope of this role..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-white focus:ring-[var(--accent)] resize-none"
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" size="md" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" loading={submitting} disabled={!roleName || !roleSlug}>
                Create Role
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ── EDIT ROLE MODAL ── */}
      {editTarget && (
        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} size="md">
          <form onSubmit={handleEditRole}>
            <ModalHeader onClose={() => setEditTarget(null)}>
              <div className="flex items-center gap-2">
                <Edit className="text-[var(--accent)] size-5 shrink-0" />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Edit Role Metadata</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {editTarget.isSystem && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <Info size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-300">
                      System roles are protected. Their name can be modified but they cannot be deactivated or deleted.
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Role Name
                  </label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-white focus:ring-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Slug (Read-Only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editTarget.slug}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-3)] text-white/50 cursor-not-allowed font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={roleDesc}
                    onChange={e => setRoleDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-white focus:ring-[var(--accent)] resize-none"
                  />
                </div>
                {!editTarget.isSystem && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-2)] bg-[var(--bg-surface-2)]">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Active Role Status</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Inactive roles cannot be assigned to any user</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRoleActive(a => !a)}
                      className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0 cursor-pointer"
                      style={{ background: roleActive ? 'var(--accent)' : 'var(--bg-surface-3)' }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                        style={{ transform: roleActive ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                    </button>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" size="md" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" loading={submitting} disabled={!roleName}>
                Save Changes
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ── MANAGE PERMISSIONS MODAL ── */}
      {manageTarget && (
        <Modal open={!!manageTarget} onClose={() => setManageTarget(null)} size="lg">
          <ModalHeader onClose={() => setManageTarget(null)}>
            <div className="flex items-center gap-2">
              <Settings className="text-[var(--accent)] size-5 shrink-0" />
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Manage Permissions</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{manageTarget.name}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4 max-h-[60vh] flex flex-col">
              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap md:flex-nowrap pb-2">
                <div className="flex items-center gap-2 flex-1 bg-[var(--bg-surface-2)] rounded-xl px-3 border border-[var(--border-2)] focus-within:border-white/20 transition-all h-9">
                  <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    value={permSearch}
                    onChange={e => setPermSearch(e.target.value)}
                    placeholder="Search permissions..."
                    className="flex-1 bg-transparent outline-none text-xs text-white placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
                <select
                  value={permModule}
                  onChange={e => setPermModule(e.target.value)}
                  className="h-9 px-3 bg-[var(--bg-surface-2)] rounded-xl border border-[var(--border-2)] text-xs text-white outline-none cursor-pointer"
                >
                  <option value="all">All Modules</option>
                  {modules.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <Button variant="secondary" size="sm" onClick={() => setSelectedPermActions(new Set(permissions.map(p => p.action)))}>
                  Select All
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSelectedPermActions(new Set())}>
                  Clear All
                </Button>
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto divide-y divide-[var(--border-2)] flex-1 pr-1">
                {filteredPermissions.map(perm => {
                  const isChecked = selectedPermActions.has(perm.action)
                  const modColor = MODULE_COLORS[perm.module] ?? 'var(--accent)'
                  return (
                    <label
                      key={perm.id}
                      className="flex items-center gap-3 py-3 px-2 hover:bg-white/5 cursor-pointer transition-colors select-none rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermissionSelection(perm.action)}
                        className="rounded border-[var(--border-2)] bg-[var(--bg-surface-2)] text-[var(--accent)] focus:ring-[var(--accent)] size-4 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{perm.name}</span>
                          <code className="text-[10px] font-mono bg-[var(--bg-surface-3)] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-tertiary)' }}>
                            {perm.action}
                          </code>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{perm.description || 'No description available.'}</p>
                      </div>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0"
                        style={{ background: `${modColor}15`, color: modColor }}
                      >
                        {perm.module}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {selectedPermActions.size} permissions selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="md" onClick={() => setManageTarget(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" loading={submitting} onClick={handleSavePermissions}>
                  Save Permissions
                </Button>
              </div>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* ── DELETE ROLE CONFIRMATION ── */}
      {deleteTarget && (
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
          <ModalHeader onClose={() => setDeleteTarget(null)}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-400 size-5 shrink-0" />
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Delete Custom Role?</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to permanently delete the custom role <strong className="text-white">"{deleteTarget.name}"</strong>?
              This action is destructive and cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" loading={submitting} onClick={handleDeleteRole}>
              Delete Role
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
