'use client'

import React from 'react'
import { Building2, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import type { Organisation } from '@/types'

interface TeamPageHeaderProps {
  currentOrg: Organisation | null
  isOrgActive: boolean
  onRegisterOrgClick: () => void
  onNewDeptClick: () => void
}

export function TeamPageHeader({
  currentOrg,
  isOrgActive,
  onRegisterOrgClick,
  onNewDeptClick,
}: TeamPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="text-[var(--accent)]" size={24} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {currentOrg ? currentOrg.name : 'Team & Organization Admin'}
          </h1>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Manage departmental policies, domain verification gating, and employee DLP roster.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {!currentOrg && (
          <Button variant="primary" size="sm" onClick={onRegisterOrgClick}>
            <Building2 size={13} className="mr-1.5" /> Register Organization
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={onNewDeptClick}
          disabled={!isOrgActive}
          title={!isOrgActive ? 'Verify domain to create departments' : undefined}
        >
          <FolderPlus size={13} className="mr-1.5" /> New Department
        </Button>
      </div>
    </div>
  )
}
