'use client'

import React from 'react'
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@/components/ui'
import { Building2, RefreshCw } from 'lucide-react'
import { AdminOrgItem, OrgTableRow } from './OrgTableRow'

interface OrgTableProps {
  loading: boolean
  orgs: AdminOrgItem[]
  filteredOrgs: AdminOrgItem[]
  actionInProgress: string | null
  onManualVerify: (orgId: string, orgName: string) => void
  onToggleStatus: (org: AdminOrgItem) => void
  onDeleteOrg: (orgId: string, orgName: string) => void
  onOpenFreezeModal: (org: AdminOrgItem) => void
  onImpersonate: (org: AdminOrgItem) => void
}

export function OrgTable({
  loading,
  orgs,
  filteredOrgs,
  actionInProgress,
  onManualVerify,
  onToggleStatus,
  onDeleteOrg,
  onOpenFreezeModal,
  onImpersonate,
}: OrgTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full text-left text-xs">
          <TableHead
            className="text-[10px] font-bold uppercase tracking-wider border-b"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-tertiary)',
            }}
          >
            <TableRow>
              <TableHeaderCell className="px-5 py-3.5">Organization / Domain</TableHeaderCell>
              <TableHeaderCell className="px-4 py-3.5">Admin Contact</TableHeaderCell>
              <TableHeaderCell className="px-4 py-3.5">Status</TableHeaderCell>
              <TableHeaderCell className="px-4 py-3.5">Domain Verification</TableHeaderCell>
              <TableHeaderCell className="px-4 py-3.5 text-center">Users</TableHeaderCell>
              <TableHeaderCell className="px-4 py-3.5 text-center">Depts</TableHeaderCell>
              <TableHeaderCell className="px-5 py-3.5 text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-[var(--border)]">
            {loading && orgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-10 text-center text-[var(--text-muted)]">
                  <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[var(--accent)]" />
                  <span>Loading organizations...</span>
                </TableCell>
              </TableRow>
            ) : filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-12 text-center text-[var(--text-muted)]">
                  <Building2 className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-[14px]">No organizations found</p>
                  <p className="text-[12px] mt-0.5">Try adjusting your search query or status filter.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <OrgTableRow
                  key={org.id}
                  org={org}
                  actionInProgress={actionInProgress}
                  onManualVerify={onManualVerify}
                  onToggleStatus={onToggleStatus}
                  onDeleteOrg={onDeleteOrg}
                  onOpenFreezeModal={onOpenFreezeModal}
                  onImpersonate={onImpersonate}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
