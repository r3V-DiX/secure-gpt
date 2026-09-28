'use client'

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
    <div className="p-3.5 rounded-md border border-[var(--border-2)] bg-[var(--bg-surface)] flex flex-col md:flex-row items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by name, email, or org..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Role Filter */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] whitespace-nowrap font-medium">
          <Filter size={12} />
          <span>Role:</span>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            onResetPage()
          }}
          className="px-2.5 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent)]"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap font-medium">Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')
            onResetPage()
          }}
          className="px-2.5 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent)]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>
      </div>
    </div>
  )
}
