'use client'

import { IconButton } from '@/components/ui'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Layers, FolderPlus, Plus, SlidersHorizontal, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import type { Department, AuthUser } from '@/types'

interface DepartmentDeckProps {
  departments: Department[]
  users: AuthUser[]
  isOrgActive: boolean
  onOpenDeptModal: () => void
  onOpenInviteWithDept: (deptId: string) => void
}

export function DepartmentDeck({
  departments,
  users,
  isOrgActive,
  onOpenDeptModal,
  onOpenInviteWithDept,
}: DepartmentDeckProps) {
  const router = useRouter()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
            <Layers size={14} style={{ color: 'var(--accent)' }} /> Department DLP Profiles ({departments.length})
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Tier 3 policies customize masking & blocking rules per department (e.g. Engineering vs Finance).
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenDeptModal}
          disabled={!isOrgActive}
          title={!isOrgActive ? 'Verify domain to create employee categories' : undefined}
        >
          <Plus size={12} className="mr-1" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.length === 0 ? (
          <div
            className="col-span-full p-8 text-center border border-dashed rounded-md"
            style={{ borderColor: 'var(--border-2)', background: 'var(--bg-surface)' }}
          >
            <div
              className="size-9 rounded-xl mx-auto flex items-center justify-center mb-2"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              <FolderPlus size={18} />
            </div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              No custom departments created yet
            </p>
            <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              Create categories like <b>Engineering</b>, <b>Finance</b>, or <b>HR</b> to apply specialized masking rules.
            </p>
            <Button variant="secondary" size="sm" onClick={onOpenDeptModal} className="mt-3">
              Create First Department
            </Button>
          </div>
        ) : (
          departments.map((dept) => {
            const memberCount = users.filter((u) => u.departmentId === dept.id).length
            return (
              <div
                key={dept.id}
                className="p-5 rounded-md border transition-all flex flex-col justify-between group hover:border-[var(--accent)] hover:shadow-md"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {dept.name}
                    </h4>
                    <span
                      className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                    >
                      {memberCount} members
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2 mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {dept.description || 'General organizational security policies apply.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Button variant="primary"
                    type="button"
                    onClick={() => router.push(`/policy?department_id=${dept.id}`)}
                    className="flex-1"

                  >
                    <SlidersHorizontal size={12} /> Configure Policy
                  </Button>
                  <IconButton aria-label={!isOrgActive ? 'Verify domain to invite employees' : 'Invite colleague to this category'} variant="secondary"
                    type="button"
                    disabled={!isOrgActive}
                    onClick={() => onOpenInviteWithDept(dept.id)}


                    title={!isOrgActive ? 'Verify domain to invite employees' : 'Invite colleague to this category'}
                  >
                    <UserPlus size={12} />
                  </IconButton>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
