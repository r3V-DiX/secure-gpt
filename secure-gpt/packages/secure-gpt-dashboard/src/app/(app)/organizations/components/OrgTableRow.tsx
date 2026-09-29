'use client'

import { IconButton } from '@/components/ui'
import { TableRow, TableCell, Button } from '@/components/ui'
import React from 'react'
import {
  Building2, Globe2, CheckCircle2, AlertCircle,
  PlayCircle, Ban, Trash2
} from 'lucide-react'
import { clsx } from 'clsx'

export interface AdminOrgItem {
  id: string
  name: string
  domain: string | null
  admin_email: string
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
  plan: string
  is_active: boolean
  dns_txt_token: string | null
  domain_verified_at: string | null
  created_at: string | null
  user_count: number
  active_user_count: number
  department_count: number
}

interface OrgTableRowProps {
  org: AdminOrgItem
  actionInProgress: string | null
  onManualVerify: (orgId: string, orgName: string) => void
  onToggleStatus: (org: AdminOrgItem) => void
  onDeleteOrg: (orgId: string, orgName: string) => void
}

export function OrgTableRow({
  org,
  actionInProgress,
  onManualVerify,
  onToggleStatus,
  onDeleteOrg,
}: OrgTableRowProps) {
  const isVerified = Boolean(org.domain_verified_at)
  const isPending = org.status === 'PENDING_VERIFICATION'
  const isSuspended = org.status === 'SUSPENDED'
  const isActing = actionInProgress === org.id

  return (
    <TableRow className="hover:bg-[var(--bg-surface-2)]/60 transition-colors">
      {/* Name & Domain */}
      <TableCell className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)] font-bold text-xs">
            <Building2 size={16} />
          </div>
          <div>
            <div className="font-bold text-[13.5px] text-[var(--text-primary)]">
              {org.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-[var(--text-muted)] font-mono">
              <Globe2 size={12} />
              <span>{org.domain || 'no domain'}</span>
            </div>
          </div>
        </div>
      </TableCell>

      {/* Admin Email */}
      <TableCell className="px-4 py-4 text-[var(--text-secondary)] font-mono text-[12px]">
        {org.admin_email}
      </TableCell>

      {/* Status */}
      <TableCell className="px-4 py-4">
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider',
            org.status === 'ACTIVE'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              : isPending
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
          )}
        >
          <span className={clsx(
            'size-1.5 rounded-full',
            org.status === 'ACTIVE' ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
          )} />
          {org.status === 'PENDING_VERIFICATION' ? 'Pending' : org.status}
        </span>
      </TableCell>

      {/* Domain Verification */}
      <TableCell className="px-4 py-4">
        {isVerified ? (
          <div className="flex items-center gap-1.5 text-emerald-500 text-[12px] font-semibold">
            <CheckCircle2 size={15} />
            <span>Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-amber-500 text-[12px] font-semibold">
              <AlertCircle size={15} />
              <span>Unverified</span>
            </div>
            <Button variant="primary"
              type="button"
              onClick={() => onManualVerify(org.id, org.name)}
              disabled={isActing}

              title="Override and mark domain as verified"
            >
              Verify DNS
            </Button>
          </div>
        )}
      </TableCell>

      {/* User Stats */}
      <TableCell className="px-4 py-4 text-center">
        <span className="font-bold text-[13px] text-[var(--text-primary)]">
          {org.active_user_count}
        </span>
        <span className="text-[11px] text-[var(--text-muted)] font-normal">
          {' '}/ {org.user_count}
        </span>
      </TableCell>

      {/* Dept Stats */}
      <TableCell className="px-4 py-4 text-center font-bold text-[13px] text-[var(--text-secondary)]">
        {org.department_count}
      </TableCell>

      {/* Actions */}
      <TableCell className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {/* Suspend / Activate Toggle */}
          <Button variant="ghost"
            type="button"
            onClick={() => onToggleStatus(org)}
            disabled={isActing}
            className={clsx(
              'p-1.5 rounded-lg border transition-colors cursor-pointer',
              isSuspended
                ? 'text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10'
                : 'text-amber-500 border-amber-500/30 hover:bg-amber-500/10'
            )}
            title={isSuspended ? 'Activate organization' : 'Suspend organization'}
          >
            {isSuspended ? <PlayCircle size={15} /> : <Ban size={15} />}
          </Button>

          {/* Delete */}
          <IconButton aria-label="Delete organization" variant="danger"
            type="button"
            onClick={() => onDeleteOrg(org.id, org.name)}
            disabled={isActing}

            title="Delete organization"
          >
            <Trash2 size={15} />
          </IconButton>
        </div>
      </TableCell>
    </TableRow>
  )
}
