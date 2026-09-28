'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import {
  Shield,
  Building,
  UserX,
  UserCheck,
  Trash2,
  X,
} from 'lucide-react'
import type { Role } from '@/types'
import { BulkModals } from './BulkModals'

interface UserBulkActionsBarProps {
  selectedCount: number
  selectedUserIds: string[]
  roles: Role[]
  onClearSelection: () => void
  onExecuteAction: (action: string, params?: { orgId?: string; roleSlugs?: string[] }) => Promise<void>
}

export function UserBulkActionsBar({
  selectedCount,
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

      <BulkModals
        modalType={modalType}
        selectedCount={selectedCount}
        targetOrg={targetOrg}
        setTargetOrg={setTargetOrg}
        roles={roles}
        selectedRoleSlugs={selectedRoleSlugs}
        handleToggleRoleSlug={handleToggleRoleSlug}
        handleCloseModal={handleCloseModal}
        handleConfirmAction={handleConfirmAction}
        loading={loading}
      />
    </>
  )
}
