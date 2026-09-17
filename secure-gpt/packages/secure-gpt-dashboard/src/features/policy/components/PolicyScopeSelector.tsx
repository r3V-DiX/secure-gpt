'use client'

import React, { useState } from 'react'
import { Layers, Building2, FolderGit2, Sparkles, Check, ChevronRight } from 'lucide-react'

interface Department {
  id: string
  name: string
}

interface Props {
  departmentId: string | undefined
  departments: Department[]
  activeDept: Department | undefined
  onSelectScope: (deptId: string | undefined) => void
}

export function PolicyScopeSelector({
  departmentId,
  departments,
  activeDept,
  onSelectScope,
}: Props) {
  const isOrg = !departmentId

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all"
      style={{
        background: 'var(--bg-surface)',
        borderColor: isOrg ? 'var(--border-2)' : 'var(--accent-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute -right-16 -top-16 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-3xl transition-all"
        style={{
          background: isOrg ? 'var(--accent)' : 'var(--info)',
        }}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center p-1.5 rounded-lg border shadow-xs"
              style={{
                background: 'var(--accent-light)',
                borderColor: 'var(--accent-border)',
                color: 'var(--accent)',
              }}
            >
              <Layers size={15} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Policy Governance Scope
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all"
              style={{
                background: isOrg ? 'var(--bg-surface-2)' : 'var(--accent-light)',
                borderColor: isOrg ? 'var(--border)' : 'var(--accent-border)',
                color: isOrg ? 'var(--text-secondary)' : 'var(--accent-text)',
              }}
            >
              {isOrg ? 'Organization Baseline' : `Department: ${activeDept?.name || departmentId}`}
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {isOrg ? (
              <>
                Editing global baseline DLP policies applied across all teams and departments.
              </>
            ) : (
              <>
                Overriding baseline policies specifically for members of the{' '}
                <strong className="text-[var(--text-primary)] font-semibold">{activeDept?.name || 'Department'}</strong> unit.
              </>
            )}
          </p>
        </div>

        {/* Scope Pill Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap p-1 rounded-xl border self-start lg:self-center"
             style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => onSelectScope(undefined)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isOrg
                ? 'shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]'
            }`}
            style={{
              background: isOrg ? 'var(--accent)' : 'transparent',
              color: isOrg ? '#ffffff' : undefined,
            }}
          >
            <Building2 size={13} className={isOrg ? 'text-white' : 'text-[var(--text-tertiary)]'} />
            <span>Org Baseline</span>
            {isOrg && <Check size={12} className="ml-0.5 text-white/90" />}
          </button>

          {departments.map((dept) => {
            const isSelected = departmentId === dept.id
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => onSelectScope(dept.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]'
                }`}
                style={{
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  color: isSelected ? '#ffffff' : undefined,
                }}
              >
                <FolderGit2 size={13} className={isSelected ? 'text-white' : 'text-[var(--text-tertiary)]'} />
                <span>{dept.name}</span>
                {isSelected && <Check size={12} className="ml-0.5 text-white/90" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

