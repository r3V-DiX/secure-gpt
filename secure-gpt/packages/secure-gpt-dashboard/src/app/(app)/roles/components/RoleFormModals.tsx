'use client'

import { IconButton } from '@/components/ui'
import { Input, Textarea } from '@/components/ui'
import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { Shield, Edit, AlertTriangle } from 'lucide-react'
import type { Role } from '@/types'

interface RoleFormModalsProps {
  showCreate: boolean
  onCloseCreate: () => void
  handleCreateRole: (e: React.FormEvent) => Promise<void>
  roleName: string
  setRoleName: (name: string) => void
  roleSlug: string
  setRoleSlug: (slug: string) => void
  roleDesc: string
  setRoleDesc: (desc: string) => void
  autoSlug: (name: string) => string
  submitting: boolean

  editTarget: Role | null
  onCloseEdit: () => void
  handleEditRole: (e: React.FormEvent) => Promise<void>
  roleActive: boolean
  setRoleActive: React.Dispatch<React.SetStateAction<boolean>>

  deleteTarget: Role | null
  onCloseDelete: () => void
  handleDeleteRole: () => Promise<void>
}

export function RoleFormModals({
  showCreate,
  onCloseCreate,
  handleCreateRole,
  roleName,
  setRoleName,
  roleSlug,
  setRoleSlug,
  roleDesc,
  setRoleDesc,
  autoSlug,
  submitting,

  editTarget,
  onCloseEdit,
  handleEditRole,
  roleActive,
  setRoleActive,

  deleteTarget,
  onCloseDelete,
  handleDeleteRole,
}: RoleFormModalsProps) {
  return (
    <>
      {/* ── CREATE ROLE MODAL ── */}
      {showCreate && (
        <Modal open={showCreate} onClose={onCloseCreate} size="md">
          <form onSubmit={handleCreateRole}>
            <ModalHeader onClose={onCloseCreate}>
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
                  <Input aria-label="e.g. Senior Security Auditor"
                    type="text"
                    required
                    value={roleName}
                    onChange={e => {
                      setRoleName(e.target.value)
                      setRoleSlug(autoSlug(e.target.value))
                    }}
                    placeholder="e.g. Senior Security Auditor"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Slug Identification (Unique)
                  </label>
                  <Input aria-label="senior_security_auditor"
                    type="text"
                    required
                    value={roleSlug}
                    onChange={e => setRoleSlug(e.target.value)}
                    placeholder="senior_security_auditor"
                    className="w-full font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Description
                  </label>
                  <Textarea aria-label="Provide a description of the scope of this role..."
                    rows={3}
                    value={roleDesc}
                    onChange={e => setRoleDesc(e.target.value)}
                    placeholder="Provide a description of the scope of this role..."
                    className="w-full"
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" size="md" onClick={onCloseCreate}>
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
        <Modal open={!!editTarget} onClose={onCloseEdit} size="md">
          <form onSubmit={handleEditRole}>
            <ModalHeader onClose={onCloseEdit}>
              <div className="flex items-center gap-2">
                <Edit className="text-[var(--accent)] size-5 shrink-0" />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Edit Role Metadata</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Role Name
                  </label>
                  <Input aria-label="Role Name"
                    type="text"
                    required
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Slug (Read-Only)
                  </label>
                  <Input aria-label="Slug (Read-Only)"
                    type="text"
                    disabled
                    value={editTarget.slug}
                    className="w-full font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Description
                  </label>
                  <Textarea aria-label="Description"
                    rows={3}
                    value={roleDesc}
                    onChange={e => setRoleDesc(e.target.value)}
                    className="w-full"
                  />
                </div>
                {!editTarget.isSystem && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-2)] bg-[var(--bg-surface-2)]">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Active Role Status</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Inactive roles cannot be assigned to any user</p>
                    </div>
                    <IconButton aria-label="View details" variant="primary"
                      type="button"
                      onClick={() => setRoleActive(a => !a)}
                      className="relative w-10 shrink-0"
                      style={{ background: roleActive ? 'var(--accent)' : 'var(--bg-surface-3)' }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                        style={{ transform: roleActive ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                    </IconButton>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" size="md" onClick={onCloseEdit}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" loading={submitting} disabled={!roleName}>
                Save Changes
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ── DELETE ROLE CONFIRMATION ── */}
      {deleteTarget && (
        <Modal open={!!deleteTarget} onClose={onCloseDelete} size="sm">
          <ModalHeader onClose={onCloseDelete}>
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
            <Button variant="ghost" size="md" onClick={onCloseDelete}>
              Cancel
            </Button>
            <Button variant="danger" size="md" loading={submitting} onClick={handleDeleteRole}>
              Delete Role
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  )
}
