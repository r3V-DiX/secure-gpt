'use client'

import React, { useState } from 'react'
import { FolderInput, UserCog, UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { Modal, ModalHeader, ModalBody, ModalFooter, useDangerConfirm } from '@/components/ui/modal/modal'
import { useToast } from '@/contexts/toast-context'
import { FloatingActionBar } from '@/components/shared/FloatingActionBar'
import { Department } from '@/types'

interface TeamBulkActionsBarProps {
  selectedIds: string[]
  totalCount: number
  departments: Department[]
  onClearSelection: () => void
  onBulkAction: (
    action: 'assign_department' | 'change_role' | 'deactivate' | 'activate' | 'delete',
    extra?: { department_id?: string; role?: string }
  ) => Promise<{ success: boolean; error?: string }>
}

export function TeamBulkActionsBar({
  selectedIds,
  totalCount,
  departments,
  onClearSelection,
  onBulkAction,
}: TeamBulkActionsBarProps) {
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('employee')
  const [executing, setExecuting] = useState(false)

  const confirmDanger = useDangerConfirm()
  const { toast } = useToast()

  const handleBulkDeptAssign = async () => {
    setExecuting(true)
    const res = await onBulkAction('assign_department', { department_id: selectedDeptId })
    setExecuting(false)
    if (res.success) {
      toast.success(`Assigned ${selectedIds.length} members to department.`)
      setDeptModalOpen(false)
      onClearSelection()
    } else {
      toast.error(res.error || 'Failed to update department.')
    }
  }

  const handleBulkRoleChange = async () => {
    setExecuting(true)
    const res = await onBulkAction('change_role', { role: selectedRole })
    setExecuting(false)
    if (res.success) {
      toast.success(`Updated role for ${selectedIds.length} members.`)
      setRoleModalOpen(false)
      onClearSelection()
    } else {
      toast.error(res.error || 'Failed to update roles.')
    }
  }

  const handleBulkDeactivate = async () => {
    const ok = await confirmDanger({
      title: `Deactivate ${selectedIds.length} Members?`,
      description: `Are you sure you want to deactivate ${selectedIds.length} employees? They will lose DLP access and session rights immediately.`,
      confirmLabel: 'Deactivate Selected',
    })
    if (!ok) return

    setExecuting(true)
    const res = await onBulkAction('deactivate')
    setExecuting(false)
    if (res.success) {
      toast.success(`Deactivated ${selectedIds.length} members.`)
      onClearSelection()
    } else {
      toast.error(res.error || 'Failed to deactivate users.')
    }
  }

  const countText = `${selectedIds.length} employee${selectedIds.length > 1 ? 's' : ''} selected`

  return (
    <>
      <FloatingActionBar
        visible={selectedIds.length > 0}
        indicatorColor="var(--accent)"
        label={<span className="font-semibold text-[var(--text-primary)]">{countText}</span>}
        onDismiss={onClearSelection}
        dismissLabel="Clear selection"
      >
        <button
          type="button"
          onClick={() => setDeptModalOpen(true)}
          disabled={executing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 hover:bg-[var(--bg-surface-2)] cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <FolderInput size={12} /> Assign Department
        </button>

        <button
          type="button"
          onClick={() => setRoleModalOpen(true)}
          disabled={executing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 hover:bg-[var(--bg-surface-2)] cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <UserCog size={12} /> Change Role
        </button>

        <button
          type="button"
          onClick={handleBulkDeactivate}
          disabled={executing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-pointer"
          style={{ borderColor: 'var(--border)' }}
        >
          <UserMinus size={12} /> Deactivate
        </button>
      </FloatingActionBar>

      {/* Bulk Assign Department Modal */}
      <Modal open={deptModalOpen} onClose={() => setDeptModalOpen(false)} size="sm">
        <ModalHeader onClose={() => setDeptModalOpen(false)}>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Assign Department ({selectedIds.length} Members)
          </h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Select the target department for all {selectedIds.length} selected employees.
            </p>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="unassigned">Unassigned (General Org Pool)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setDeptModalOpen(false)} disabled={executing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBulkDeptAssign} disabled={executing}>
              {executing ? <Loader2 size={13} className="animate-spin" /> : 'Apply to Selected'}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Bulk Change Role Modal */}
      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} size="sm">
        <ModalHeader onClose={() => setRoleModalOpen(false)}>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Change Role ({selectedIds.length} Members)
          </h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Select the new role to grant across all {selectedIds.length} selected employees.
            </p>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="employee">EMPLOYEE (Standard DLP Guard)</option>
              <option value="org_admin">ORG_ADMIN (Organization Admin)</option>
              <option value="user">USER (Personal Account)</option>
            </select>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setRoleModalOpen(false)} disabled={executing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBulkRoleChange} disabled={executing}>
              {executing ? <Loader2 size={13} className="animate-spin" /> : 'Update Roles'}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  )
}
