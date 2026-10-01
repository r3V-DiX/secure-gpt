'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import { Shield, Building, UserX, UserCheck, Trash2 } from 'lucide-react'
import type { Role } from '@/types'
import { BulkModals } from './BulkModals'
import { FloatingActionBar } from '@/components/shared/FloatingActionBar'

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

  const countText = `${selectedCount} user${selectedCount !== 1 ? 's' : ''} selected`

  return (
    <>
      <FloatingActionBar
        visible={selectedCount > 0}
        indicatorColor="var(--accent)"
        label={<span className="font-semibold text-[var(--text-primary)]">{countText}</span>}
        onDismiss={onClearSelection}
        dismissLabel="Clear selection"
      >
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
          className="gap-1.5 text-xs"
          disabled={loading}
        >
          <UserCheck size={13} />
          Activate
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenModal('deactivate')}
          className="gap-1.5 text-xs"
          disabled={loading}
        >
          <UserX size={13} />
          Suspend
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenModal('delete')}
          className="gap-1.5 text-xs"
          disabled={loading}
        >
          <Trash2 size={13} />
          Delete
        </Button>
      </FloatingActionBar>

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
