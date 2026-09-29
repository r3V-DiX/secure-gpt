'use client'
import { IconButton } from '@/components/ui'
import { Checkbox } from '@/components/ui/input/selection'

import { TableRow, TableCell, Button, Select } from '@/components/ui'
import React from 'react'
import { CheckSquare, Square, Trash2 } from 'lucide-react'
import type { AuthUser, Department } from '@/types'

interface TeamMemberRowProps {
  user: AuthUser
  currentUser: AuthUser | null
  departments: Department[]
  isSelected: boolean
  onToggleSelect: (userId: string) => void
  onChangeRole: (userId: string, role: string) => Promise<any>
  onAssignDepartment: (userId: string, deptId: string | null) => Promise<any>
  onDeleteClick: (user: AuthUser) => void
}

export function TeamMemberRow({
  user: u,
  currentUser,
  departments,
  isSelected,
  onToggleSelect,
  onChangeRole,
  onAssignDepartment,
  onDeleteClick,
}: TeamMemberRowProps) {
  const isSuperOrOrgAdmin =
    currentUser?.role === 'org_admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'platform_super_admin'

  return (
    <TableRow
      className={`transition-colors ${
        isSelected ? 'bg-[var(--accent-light)]/40' : 'hover:bg-[var(--bg-surface-2)]/60'
      }`}
    >
      <TableCell className="px-4 py-3.5 text-center">
        <Checkbox aria-label="Select employee" checked={isSelected} onChange={() => onToggleSelect(u.id)} />
      </TableCell>

      <TableCell className="px-5 py-3.5 flex items-center gap-3">
        <div
          className="size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
        >
          {u.email[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {u.fullName || u.email.split('@')[0]}
          </p>
          <p className="text-[11px] font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
            {u.email}
          </p>
        </div>
      </TableCell>

      <TableCell className="px-5 py-3.5">
        {isSuperOrOrgAdmin ? (
          <Select aria-label="EMPLOYEE" wrapperClassName="w-auto min-w-0"
            value={u.role}
            onChange={(e) => onChangeRole(u.id, e.target.value)}

          >
            <option value="employee">EMPLOYEE</option>
            <option value="org_admin">ORG_ADMIN</option>
            <option value="user">USER</option>
          </Select>
        ) : (
          <span
            className="text-[11px] font-mono font-semibold uppercase px-2.5 py-1 rounded-md"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {u.role}
          </span>
        )}
      </TableCell>

      <TableCell className="px-5 py-3.5">
        <Select aria-label="General Org Policy" wrapperClassName="w-auto min-w-0"
          value={u.departmentId || ''}
          onChange={(e) => onAssignDepartment(u.id, e.target.value || null)}

        >
          <option value="">General Org Policy</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </TableCell>

      <TableCell className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Protection
        </span>
      </TableCell>

      <TableCell className="px-5 py-3.5 text-right">
        {u.id !== currentUser?.id ? (
          <IconButton aria-label="Terminate / Remove User" variant="danger"
            type="button"
            onClick={() => onDeleteClick(u)}
            className="inline-flex"

            title="Terminate / Remove User"
          >
            <Trash2 size={13} />
          </IconButton>
        ) : (
          <span className="text-[11px] text-[var(--text-muted)] italic">You</span>
        )}
      </TableCell>
    </TableRow>
  )
}
