'use client'

import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import type { Department } from '@/types'
import type { TeamFilters } from '@/features/team/hooks/use-team'

interface TeamFilterBarProps {
  searchInput: string
  filters: TeamFilters
  departments: Department[]
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  onUpdateFilters: (partial: Partial<TeamFilters>) => void
}

export function TeamFilterBar({
  searchInput,
  filters,
  departments,
  onSearchChange,
  onClearSearch,
  onUpdateFilters,
}: TeamFilterBarProps) {
  return (
    <div
      className="p-3 rounded-md border flex flex-col md:flex-row items-stretch md:items-center gap-3"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search employees by name or email (e.g. sarah, @acme)..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full text-xs pl-8 pr-8 py-2 rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
          style={{ borderColor: 'var(--border-2)' }}
        />
        {searchInput && (
          <button
            onClick={onClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-1.5">
        <Filter size={13} className="text-[var(--text-tertiary)] shrink-0" />
        <select
          value={filters.department_id || ''}
          onChange={(e) => onUpdateFilters({ department_id: e.target.value })}
          className="text-xs py-2 px-2.5 rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          style={{ borderColor: 'var(--border-2)' }}
        >
          <option value="">All Departments</option>
          <option value="unassigned">Unassigned Only</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} {d.members_count !== undefined ? `(${d.members_count})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Role Filter */}
      <div>
        <select
          value={filters.role || ''}
          onChange={(e) => onUpdateFilters({ role: e.target.value })}
          className="text-xs py-2 px-2.5 rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          style={{ borderColor: 'var(--border-2)' }}
        >
          <option value="">All Roles</option>
          <option value="employee">EMPLOYEE</option>
          <option value="org_admin">ORG_ADMIN</option>
          <option value="user">USER</option>
        </select>
      </div>
    </div>
  )
}
