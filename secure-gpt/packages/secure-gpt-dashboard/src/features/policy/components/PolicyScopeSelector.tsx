'use client'

import React from 'react'
import { Layers } from 'lucide-react'

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
  return (
    <div
      className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-2)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div>
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Policy Governance Scope
          </span>
        </div>
        <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
          {departmentId
            ? `Editing specialized DLP rules for the "${activeDept?.name || 'Department'}" category.`
            : 'Editing company-wide organization baseline DLP policy.'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onSelectScope(undefined)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            !departmentId
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
          }`}
        >
          🏢 Org Baseline
        </button>
        {departments.map((dept) => (
          <button
            key={dept.id}
            type="button"
            onClick={() => onSelectScope(dept.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              departmentId === dept.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            📁 {dept.name}
          </button>
        ))}
      </div>
    </div>
  )
}
