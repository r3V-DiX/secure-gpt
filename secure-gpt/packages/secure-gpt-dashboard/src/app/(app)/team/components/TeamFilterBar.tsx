'use client'

import { FilterBar } from '@/components/ui'
import { IconButton } from '@/components/ui'
import { Input, Button, Select } from '@/components/ui'
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
    <FilterBar
      className="p-3 rounded-md border flex flex-col md:flex-row items-stretch md:items-center gap-3"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Search Bar */}
      <div className="relative flex-1">

        <Input aria-label="Search employees by name or email (e.g. sarah, @acme)..." icon={<Search size={15} />}
          type="text"
          placeholder="Search employees by name or email (e.g. sarah, @acme)..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-8"

        />
        {searchInput && (
          <IconButton aria-label="Close" variant="ghost" type="button"
            onClick={onClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X size={13} />
          </IconButton>
        )}
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-1.5">
        <Filter size={13} className="text-[var(--text-tertiary)] shrink-0" />
        <Select aria-label="All Departments" wrapperClassName="w-auto min-w-0"
          value={filters.department_id || ''}
          onChange={(e) => onUpdateFilters({ department_id: e.target.value })}


        >
          <option value="">All Departments</option>
          <option value="unassigned">Unassigned Only</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} {d.members_count !== undefined ? `(${d.members_count})` : ''}
            </option>
          ))}
        </Select>
      </div>

      {/* Role Filter */}
      <div>
        <Select aria-label="All Roles" wrapperClassName="w-auto min-w-0"
          value={filters.role || ''}
          onChange={(e) => onUpdateFilters({ role: e.target.value })}


        >
          <option value="">All Roles</option>
          <option value="employee">EMPLOYEE</option>
          <option value="org_admin">ORG_ADMIN</option>
          <option value="user">USER</option>
        </Select>
      </div>
    </FilterBar>
  )
}
