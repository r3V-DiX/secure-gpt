'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import {
  Shield,
  Building,
  UserX,
  UserCheck,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import type { Role } from '@/types'

interface UserBulkActionsBarProps {
  selectedCount: number
  selectedUserIds: string[]
  roles: Role[]
  onClearSelection: () => void
  onExecuteAction: (action: string, params?: { orgId?: string; roleSlugs?: string[] }) => Promise<void>
}

export function UserBulkActionsBar({
  selectedCount,
  selectedUserIds,
  roles,
  onClearSelection,
  onExecuteAction,
}: UserBulkActionsBarProps) {
  const [loading, setLoading] = useState(false)
  const [modalType, setModalType] = useState<'org' | 'roles' | 'deactivate' | 'delete' | null>(null)
  const [targetOrg, setTargetOrg] = useState('')
  const [selectedRoleSlugs, setSelectedRoleSlugs] = useState<string[]>([])

  if (selectedCount === 0) return null

  const handleOpenModal = (type: 'org' | 'roles' | 'deactivate' | 'delete') => {
    setModalType(type)
    setTargetOrg('')
    setSelectedRoleSlugs([])
  }

  const handleCloseModal = () => {
    setModalType(null)
    setTargetOrg('')
    setSelectedRoleSlugs([])
  }

  const handleConfirmAction = async () => {
    if (!modalType) return
    setLoading(true)
    try {
      if (modalType === 'org') {
        await onExecuteAction('assign_org', { orgId: targetOrg.trim() })
      } else if (modalType === 'roles') {
        await onExecuteAction('assign_roles', { roleSlugs: selectedRoleSlugs })
      } else if (modalType === 'deactivate') {
        await onExecuteAction('deactivate')
      } else if (modalType === 'delete') {
        await onExecuteAction('delete')
      }
      handleCloseModal()
      onClearSelection()
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRoleSlug = (slug: string) => {
    setSelectedRoleSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const handleDirectActivate = async () => {
    setLoading(true)
    try {
      await onExecuteAction('activate')
      onClearSelection()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl backdrop-blur-xl animate-slide-up">
        <div className="flex items-center gap-2 border-r border-[var(--border)] pr-3 text-xs font-semibold text-[var(--text-primary)]">
          <span className="size-5 rounded-full bg-[var(--accent)] text-white text-[10px] flex items-center justify-center font-bold">
            {selectedCount}
          </span>
          <span>Selected</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenModal('org')}
            className="gap-1.5 text-xs"
            disabled={loading}
          >
            <Building size={13} />
            Assign Org
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenModal('roles')}
            className="gap-1.5 text-xs"
            disabled={loading}
          >
            <Shield size={13} />
            Assign Roles
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDirectActivate}
            className="gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
            disabled={loading}
          >
            <UserCheck size={13} />
            Activate
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenModal('deactivate')}
            className="gap-1.5 text-xs text-amber-400 hover:text-amber-300"
            disabled={loading}
          >
            <UserX size={13} />
            Suspend
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenModal('delete')}
            className="gap-1.5 text-xs text-rose-400 hover:text-rose-300"
            disabled={loading}
          >
            <Trash2 size={13} />
            Delete
          </Button>
        </div>

        <button
          onClick={onClearSelection}
          className="p-1 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] transition-colors ml-1"
          title="Clear selection"
        >
          <X size={14} />
        </button>
      </div>

      {/* Modal: Bulk Assign Org */}
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
                <input
                  type="text"
                  placeholder="e.g. rivedix"
                  value={targetOrg}
                  onChange={(e) => setTargetOrg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-sm outline-none focus:border-white/20"
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

      {/* Modal: Bulk Assign Roles */}
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
                    <input
                      type="checkbox"
                      checked={selectedRoleSlugs.includes(role.slug)}
                      onChange={() => handleToggleRoleSlug(role.slug)}
                      className="mt-1 rounded border-[var(--border-2)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)] size-4 shrink-0"
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

      {/* Modal: Bulk Deactivate */}
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

      {/* Modal: Bulk Delete */}
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
