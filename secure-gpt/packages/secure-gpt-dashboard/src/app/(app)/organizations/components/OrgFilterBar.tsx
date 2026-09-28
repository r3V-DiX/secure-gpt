'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { clsx } from 'clsx'

export type OrgStatusFilter = 'ALL' | 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'

interface OrgFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedStatus: OrgStatusFilter
  onStatusChange: (status: OrgStatusFilter) => void
}

export function OrgFilterBar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
}: OrgFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, domain, or admin email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
        />
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] self-start sm:self-auto">
        {(['ALL', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => onStatusChange(st)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer',
              selectedStatus === st
                ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs border border-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {st === 'ALL'
              ? 'All Orgs'
              : st === 'PENDING_VERIFICATION'
              ? 'Pending'
              : st === 'ACTIVE'
              ? 'Active'
              : 'Suspended'}
          </button>
        ))}
      </div>
    </div>
  )
}
