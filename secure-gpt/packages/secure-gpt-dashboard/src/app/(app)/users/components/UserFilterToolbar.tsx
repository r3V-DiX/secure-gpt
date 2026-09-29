'use client'

import { FilterBar } from '@/components/ui'
import { IconButton } from '@/components/ui'
import { Input, Button, Select } from '@/components/ui'
import React from 'react'
import { Search, X, Filter } from 'lucide-react'
import type { Role } from '@/types'

interface UserFilterToolbarProps {
  search: string
  setSearch: (value: string) => void
  roleFilter: string
  setRoleFilter: (role: string) => void
  statusFilter: 'all' | 'active' | 'suspended'
  setStatusFilter: (status: 'all' | 'active' | 'suspended') => void
  roles: Role[]
  onResetPage: () => void
}

export function UserFilterToolbar({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  roles,
  onResetPage,
}: UserFilterToolbarProps) {
  return (
    <FilterBar className="p-3.5 rounded-md border border-[var(--border-2)] bg-[var(--bg-surface)] flex flex-col md:flex-row items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1 w-full">

        <Input aria-label="Search by name, email, or org..." icon={<Search size={15} />}
          type="text"
          placeholder="Search by name, email, or org..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8"
        />
        {search && (
          <IconButton aria-label="Close" variant="ghost" type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X size={14} />
          </IconButton>
        )}
      </div>

      {/* Role Filter */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] whitespace-nowrap font-medium">
          <Filter size={12} />
          <span>Role:</span>
        </div>
        <Select aria-label="All Roles" wrapperClassName="w-auto min-w-0"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            onResetPage()
          }}

        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.slug}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap font-medium">Status:</span>
        <Select aria-label="All Statuses" wrapperClassName="w-auto min-w-0"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')
            onResetPage()
          }}

        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </Select>
      </div>
    </FilterBar>
  )
}
