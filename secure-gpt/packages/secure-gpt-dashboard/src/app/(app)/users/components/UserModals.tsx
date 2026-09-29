'use client'

import { Checkbox, Input } from '@/components/ui'
import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { ShieldAlert } from 'lucide-react'
import type { AdminUser, Role } from '@/types'

interface UserModalsProps {
  editUser: AdminUser | null
  onCloseEditRoles: () => void
  roles: Role[]
  selectedRoleSlugs: string[]
  onToggleRoleSlug: (slug: string) => void
  savingRoles: boolean
  onSaveRoles: () => Promise<void>

  editOrgUser: AdminUser | null
  onCloseEditOrg: () => void
  orgDraft: string
  setOrgDraft: (org: string) => void
  savingOrg: boolean
  onSaveOrg: () => Promise<void>

  inviteOpen: boolean
  onCloseInvite: () => void
  inviteEmail: string
  setInviteEmail: (email: string) => void
  inviting: boolean
  onInviteUser: (e: React.FormEvent) => Promise<void>
}

export function UserModals({
  editUser,
  onCloseEditRoles,
  roles,
  selectedRoleSlugs,
  onToggleRoleSlug,
  savingRoles,
  onSaveRoles,

  editOrgUser,
  onCloseEditOrg,
  orgDraft,
  setOrgDraft,
  savingOrg,
  onSaveOrg,

  inviteOpen,
  onCloseInvite,
  inviteEmail,
  setInviteEmail,
  inviting,
  onInviteUser,
}: UserModalsProps) {
  return (
    <>
      {/* Edit Roles Modal */}
      {editUser && (
        <Modal open={!!editUser} onClose={onCloseEditRoles} size="md">
          <ModalHeader onClose={onCloseEditRoles}>
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
                {roles.map((role) => {
                  const checked = selectedRoleSlugs.includes(role.slug)
                  return (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-2)] bg-[var(--bg-surface-2)] cursor-pointer hover:border-white/20 transition-all select-none"
                    >
                      <Checkbox aria-label="Select item"

                        checked={checked}
                        onChange={() => onToggleRoleSlug(role.slug)}
                        className="mt-1 shrink-0"
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
                            {role.permissions.map((p) => (
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
            <Button variant="ghost" size="md" onClick={onCloseEditRoles}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={savingRoles}
              onClick={onSaveRoles}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Edit Org Modal */}
      {editOrgUser && (
        <Modal open={!!editOrgUser} onClose={onCloseEditOrg} size="sm">
          <ModalHeader onClose={onCloseEditOrg}>
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
                <Input aria-label="e.g. rivedix"
                  type="text"
                  placeholder="e.g. rivedix"
                  value={orgDraft}
                  onChange={(e) => setOrgDraft(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={onCloseEditOrg}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={savingOrg}
              onClick={onSaveOrg}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Invite Member Modal */}
      {inviteOpen && (
        <Modal open={inviteOpen} onClose={onCloseInvite} size="sm">
          <form onSubmit={onInviteUser}>
            <ModalHeader onClose={onCloseInvite}>
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
                  <Input aria-label="colleague@company.com"
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button type="button" variant="ghost" size="md" onClick={onCloseInvite}>
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
    </>
  )
}
