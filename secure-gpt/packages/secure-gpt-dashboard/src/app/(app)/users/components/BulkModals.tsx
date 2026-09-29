'use client'

import { Input, Checkbox } from '@/components/ui'
import React from 'react'
import { Button } from '@/components/ui/button/button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import { AlertTriangle } from 'lucide-react'
import type { Role } from '@/types'

interface BulkModalsProps {
  modalType: 'org' | 'roles' | 'deactivate' | 'delete' | null
  selectedCount: number
  targetOrg: string
  setTargetOrg: (val: string) => void
  roles: Role[]
  selectedRoleSlugs: string[]
  handleToggleRoleSlug: (slug: string) => void
  handleCloseModal: () => void
  handleConfirmAction: () => Promise<void>
  loading: boolean
}

export function BulkModals({
  modalType,
  selectedCount,
  targetOrg,
  setTargetOrg,
  roles,
  selectedRoleSlugs,
  handleToggleRoleSlug,
  handleCloseModal,
  handleConfirmAction,
  loading,
}: BulkModalsProps) {
  if (!modalType) return null

  return (
    <>
      {modalType === 'org' && (
        <Modal open={true} onClose={handleCloseModal} size="sm">
          <ModalHeader onClose={handleCloseModal}>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Bulk Assign Organization</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">Assign {selectedCount} selected users to an organization</p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Enter the Organization ID to assign to these {selectedCount} users. Leave blank to unassign.
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Organization ID</label>
                <Input aria-label="e.g. rivedix"
                  type="text"
                  placeholder="e.g. rivedix"
                  value={targetOrg}
                  onChange={(e) => setTargetOrg(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={handleCloseModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" size="md" loading={loading} onClick={handleConfirmAction}>
              Apply to {selectedCount} Users
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {modalType === 'roles' && (
        <Modal open={true} onClose={handleCloseModal} size="md">
          <ModalHeader onClose={handleCloseModal}>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Bulk Assign Roles</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">Update dynamic security roles for {selectedCount} selected users</p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Select the roles you wish to grant to these {selectedCount} users. Existing roles will be replaced with this selection.
              </p>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {roles.map(role => (
                  <label
                    key={role.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-2)] bg-[var(--bg-surface-2)] cursor-pointer hover:border-white/20 transition-all select-none"
                  >
                    <Checkbox aria-label="Select item"

                      checked={selectedRoleSlugs.includes(role.slug)}
                      onChange={() => handleToggleRoleSlug(role.slug)}
                      className="mt-1 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        {role.name}
                        {role.isSystem && (
                          <span className="text-[9px] bg-[var(--bg-base)] border border-[var(--border)] px-1 py-0.5 rounded uppercase text-[var(--text-tertiary)]">
                            System
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                        {role.description || 'No description available.'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={handleCloseModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" size="md" loading={loading} onClick={handleConfirmAction}>
              Update Roles ({selectedCount})
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {modalType === 'deactivate' && (
        <Modal open={true} onClose={handleCloseModal} size="sm">
          <ModalHeader onClose={handleCloseModal}>
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle size={18} />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Suspend Accounts</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to suspend <strong className="text-[var(--text-primary)]">{selectedCount}</strong> user accounts?
              Suspended users will immediately lose access to the system.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={handleCloseModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" size="md" loading={loading} onClick={handleConfirmAction}>
              Suspend {selectedCount} Users
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {modalType === 'delete' && (
        <Modal open={true} onClose={handleCloseModal} size="sm">
          <ModalHeader onClose={handleCloseModal}>
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle size={18} />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Permanent Deletion</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              ⚠️ <strong>Warning:</strong> You are about to permanently delete <strong className="text-rose-400">{selectedCount}</strong> user accounts.
              All associated sessions, devices, and custom policies will be permanently destroyed.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" onClick={handleCloseModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" size="md" loading={loading} onClick={handleConfirmAction}>
              Permanently Delete
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  )
}
