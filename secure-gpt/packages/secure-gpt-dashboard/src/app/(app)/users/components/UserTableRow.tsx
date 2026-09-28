'use client'

import React from 'react'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { Edit3, Trash2, UserMinus, UserCheck } from 'lucide-react'
import type { AdminUser, Role } from '@/types'

interface UserTableRowProps {
  user: AdminUser
  roles: Role[]
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onOpenEditOrg: (user: AdminUser) => void
  onOpenEditRoles: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => Promise<void>
  onDeleteUser: (user: AdminUser) => Promise<void>
}

export function UserTableRow({
  user,
  roles,
  isSelected,
  onToggleSelect,
  onOpenEditOrg,
  onOpenEditRoles,
  onToggleStatus,
  onDeleteUser,
}: UserTableRowProps) {
  return (
    <tr
      className={`transition-colors ${isSelected ? 'bg-[var(--accent-light)]/40' : 'hover:bg-white/5'}`}
    >
      <td className="py-3.5 px-4 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(user.id)}
          className="rounded border-[var(--border-2)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)] size-4 cursor-pointer"
        />
      </td>
      <td className="py-3.5 px-4 flex items-center gap-3">
        <Avatar src={user.avatarUrl} name={user.fullName} email={user.email} size="md" />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold truncate text-[var(--text-primary)]">
            {user.fullName || 'No Name'}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
            <span className="text-[var(--text-tertiary)]">{user.email}</span>
            {user.orgId && (
              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 py-0.5 rounded font-mono">
                org: {user.orgId}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4">
        {user.isActive ? (
          <Badge variant="success" dot>Active</Badge>
        ) : (
          <Badge variant="danger" dot>Suspended</Badge>
        )}
      </td>
      <td className="py-3.5 px-4">
        <div className="flex flex-wrap gap-1.5 max-w-[320px]">
          {user.roles && user.roles.length > 0 ? (
            user.roles.map((r) => {
              const fullRole = roles.find((x) => x.slug === r.slug)
              const permsList = fullRole?.permissions?.map((p) => p.action).join(', ') || 'No permissions'
              return (
                <Badge
                  key={r.id}
                  variant={r.slug === 'super_admin' ? 'purple' : 'info'}
                  title={`Permissions: ${permsList}`}
                >
                  {r.name}
                </Badge>
              )
            })
          ) : (
            <span className="italic text-[11px] text-[var(--text-tertiary)] opacity-70">No roles assigned</span>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4 text-right">
        <div className="inline-flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit3 size={12} />}
            onClick={() => onOpenEditOrg(user)}
          >
            Org
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit3 size={12} />}
            onClick={() => onOpenEditRoles(user)}
          >
            Roles
          </Button>
          <Button
            variant={user.isActive ? 'danger' : 'primary'}
            size="sm"
            icon={user.isActive ? <UserMinus size={12} /> : <UserCheck size={12} />}
            onClick={() => void onToggleStatus(user)}
          >
            {user.isActive ? 'Suspend' : 'Activate'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={12} />}
            onClick={() => void onDeleteUser(user)}
            title="Permanently Hard Delete User"
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  )
}
