'use client'

import React from 'react'
import { Button } from '@/components/ui/button/button'
import {
  Shield, Edit, Trash2, Users, Lock, ChevronDown, ChevronRight, Settings
} from 'lucide-react'
import type { Role } from '@/types'

const MODULE_COLORS: Record<string, string> = {
  USER: 'var(--accent)',
  POLICY: 'var(--success)',
  SYSTEM: 'var(--text-secondary)',
  AUDIT: 'var(--warning)',
  ROLE: 'var(--accent)',
  ORGANISATION: 'var(--info)'
}

interface RoleCardProps {
  role: Role
  isExpanded: boolean
  onToggleExpand: (id: string) => void
  onOpenManagePermissions: (role: Role) => void
  onOpenEdit: (role: Role) => void
  onOpenDelete: (role: Role) => void
}

export function RoleCard({
  role,
  isExpanded,
  onToggleExpand,
  onOpenManagePermissions,
  onOpenEdit,
  onOpenDelete,
}: RoleCardProps) {
  const userCount = (role as any).userCount ?? 0
  const canDelete = !role.isSystem && userCount === 0

  return (
    <div
      className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md overflow-hidden shadow-lg transition-all"
      style={{ opacity: role.isActive ? 1 : 0.65 }}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 px-5 py-4 flex-wrap sm:flex-nowrap">
        <Button variant="ghost" type="button"
          onClick={() => onToggleExpand(role.id)}
          className="w-7 shrink-0"
        >
          {isExpanded ? (
            <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
          )}
        </Button>

        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: role.isSystem ? 'rgba(239, 68, 68, 0.1)' : 'rgba(129, 140, 248, 0.1)' }}
        >
          <Shield size={15} className={role.isSystem ? 'text-red-400' : 'text-[var(--accent)]'} />
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{role.name}</span>
            <code className="text-[10px] bg-[var(--bg-surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono text-[var(--text-tertiary)]">
              {role.slug}
            </code>
            {role.isSystem && (
              <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1">
                <Lock size={8} /> System
              </span>
            )}
            {!role.isActive && (
              <span className="text-[9px] bg-white/5 border border-white/10 text-[var(--text-tertiary)] px-1.5 py-0.5 rounded uppercase font-bold">
                Inactive
              </span>
            )}
          </div>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
            {role.description || 'No description available.'}
          </p>
        </div>

        {/* Metadata and Actions */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div className="text-right hidden md:block mr-2">
            <span className="text-[12px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>
              {role.permissions?.length ?? 0} permissions
            </span>
            <span className="text-[11px] block flex items-center gap-1 justify-end" style={{ color: 'var(--text-tertiary)' }}>
              <Users size={10} /> {userCount} users
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Settings size={12} />}
            onClick={() => onOpenManagePermissions(role)}
          >
            Permissions
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit size={12} />}
            onClick={() => onOpenEdit(role)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={12} />}
            disabled={!canDelete}
            onClick={() => onOpenDelete(role)}
            title={role.isSystem ? 'System roles cannot be deleted' : userCount > 0 ? 'Assigned to active users' : 'Delete Role'}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Expanded Permissions Detail */}
      {isExpanded && (
        <div className="border-t border-[var(--border-2)] bg-[var(--bg-surface-2)]">
          <div className="px-5 py-2.5 flex items-center justify-between border-b border-[var(--border-2)]">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Assigned Permissions ({role.permissions?.length ?? 0})
            </span>
          </div>
          <div className="p-5">
            {!role.permissions?.length ? (
              <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>No permissions assigned to this role.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map(perm => {
                  const color = MODULE_COLORS[perm.module] ?? 'var(--accent)'
                  return (
                    <div
                      key={perm.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--border-2)] text-xs font-semibold"
                      style={{ background: 'var(--bg-surface)' }}
                    >
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{ background: `${color}15`, color }}
                      >
                        {perm.module}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{perm.name}</span>
                      <code className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        ({perm.action})
                      </code>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
