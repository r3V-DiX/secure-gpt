'use client'

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
    <tr
      className={`transition-colors ${
        isSelected ? 'bg-[var(--accent-light)]/40' : 'hover:bg-[var(--bg-surface-2)]/60'
      }`}
    >
      <td className="px-4 py-3.5 text-center">
        <button
          type="button"
          onClick={() => onToggleSelect(u.id)}
          className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          {isSelected ? (
            <CheckSquare size={15} className="text-[var(--accent)]" />
          ) : (
            <Square size={15} />
          )}
        </button>
      </td>

      <td className="px-5 py-3.5 flex items-center gap-3">
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
      </td>

      <td className="px-5 py-3.5">
        {isSuperOrOrgAdmin ? (
          <select
            value={u.role}
            onChange={(e) => onChangeRole(u.id, e.target.value)}
            className="ui-select h-8 px-2.5 text-[12px] font-semibold rounded-md border bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-2)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="employee">EMPLOYEE</option>
            <option value="org_admin">ORG_ADMIN</option>
            <option value="user">USER</option>
          </select>
        ) : (
          <span
            className="text-[11px] font-mono font-semibold uppercase px-2.5 py-1 rounded-md"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {u.role}
          </span>
        )}
      </td>

      <td className="px-5 py-3.5">
        <select
          value={u.departmentId || ''}
          onChange={(e) => onAssignDepartment(u.id, e.target.value || null)}
          className="ui-select h-8 px-2.5 text-[12px] font-medium rounded-md border bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-2)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
        >
          <option value="">General Org Policy</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </td>

      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Protection
        </span>
      </td>

      <td className="px-5 py-3.5 text-right">
        {u.id !== currentUser?.id ? (
          <button
            type="button"
            onClick={() => onDeleteClick(u)}
            className="p-1.5 rounded-lg border hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-slate-400 hover:text-red-600 cursor-pointer inline-flex items-center justify-center"
            style={{ borderColor: 'var(--border-2)' }}
            title="Terminate / Remove User"
          >
            <Trash2 size={13} />
          </button>
        ) : (
          <span className="text-[11px] text-[var(--text-muted)] italic">You</span>
        )}
      </td>
    </tr>
  )
}
