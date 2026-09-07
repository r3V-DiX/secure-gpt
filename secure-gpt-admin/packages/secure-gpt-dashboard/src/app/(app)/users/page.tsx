'use client'

import React, { useEffect, useState } from 'react'
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import { Shield, UserMinus, UserCheck, ShieldAlert, Loader2, Edit3, Trash2 } from 'lucide-react'
import type { AdminUser, Role } from '@/types'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  
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

  const { toast } = useToast()

  async function loadData() {
    try {
      setLoading(true)
      const [usersData, rolesData] = await Promise.all([
        apiGet<AdminUser[]>('/admin/users'),
        apiGet<Role[]>('/admin/roles')
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user management data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Toggle user suspension
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
      // Refresh user status locally
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, isActive: response.isActive } : u))
      )
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status.')
    }
  }

  // Delete user permanently
  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `⚠️ PERMANENT ACTION:\nAre you sure you want to PERMANENTLY delete user ${user.fullName || user.email}?\nAll active sessions, devices, and permissions will be destroyed immediately.`
    )
    if (!confirmed) return

    try {
      await apiDelete(`/admin/users/${user.id}`)
      toast.success(`User ${user.fullName || user.email} has been permanently deleted.`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
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
      
      // Update local state roles list
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
      
      // Update local state orgId
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
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite user.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 w-full animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="text-[var(--accent)] size-5 shrink-0" />
            User Management (RBAC)
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            Control dynamic role assignments, view active users, and manage account statuses.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<UserCheck size={14} />}
          onClick={() => setInviteOpen(true)}
        >
          Add Member
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[var(--accent)] size-8" />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading user configuration...</span>
        </div>
      ) : (
        <div className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-2)] bg-[var(--bg-surface-2)] text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Active Status</th>
                  <th className="py-3 px-4">Assigned Roles</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-2)] text-[13px]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <Avatar src={u.avatarUrl} name={u.fullName} email={u.email} size="md" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {u.fullName || 'No Name'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                          <span style={{ color: 'var(--text-tertiary)' }}>{u.email}</span>
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
                          <span className="italic text-[11px]" style={{ color: 'var(--text-tertiary)', opacity: 0.7 }}>No roles assigned</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Roles Modal */}
      {editUser && (
        <Modal open={!!editUser} onClose={() => setEditUser(null)} size="md">
          <ModalHeader onClose={() => setEditUser(null)}>
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-[var(--accent)] size-5 shrink-0" />
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Modify Security Roles</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{editUser.email}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
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
                        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                          {role.name}
                          {role.isSystem && (
                            <span className="text-[9px] bg-[var(--bg-base)] border border-[var(--border)] px-1 py-0.5 rounded uppercase" style={{ color: 'var(--text-tertiary)' }}>
                              System
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {role.description || 'No description available.'}
                        </span>
                        {role.permissions && role.permissions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {role.permissions.map(p => (
                              <span
                                key={p.id}
                                className="text-[9px] px-1.5 py-0.5 rounded border font-mono"
                                style={{ background: 'var(--bg-surface-3)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
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
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Update Organization Assignment</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{editOrgUser.email}</p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                Assign this user to an organization ID. All users with the same organization ID will share the same DLP policies. Leave blank to unassign.
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>Organization ID</label>
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
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Invite Team Member</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Add a new user to your organization</p>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  Enter the email address of the person you want to invite.
                </p>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
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
