'use client'
// src/features/event-log/components/EventLogFilters.tsx
import { FilterBar } from '@/components/ui'
import { IconButton } from '@/components/ui'
import { Input, Button, Select } from '@/components/ui'
import { Search, X, Calendar } from 'lucide-react'
import type { LogFilters } from '../services/event-log.service'

interface EventLogFiltersProps {
  filters: LogFilters
  onFilterChange: (updates: Partial<LogFilters>) => void
}

const CATEGORIES = ['FINANCIAL', 'PII', 'CONFIDENTIAL', 'IP']
const ACTIONS = ['BLOCK', 'MASK', 'WARN_ALLOW', 'ALLOW']
const PLATFORMS = ['chatgpt', 'gemini', 'claude', 'copilot', 'perplexity']

export function EventLogFilters({ filters, onFilterChange }: EventLogFiltersProps) {
  return (
    <FilterBar className="flex flex-wrap items-center gap-3 py-1">
      {/* Search */}
      <div className="relative group flex-1 min-w-[240px] max-w-sm">

        <Input aria-label="Search events..." icon={<Search size={15} />}
          type="text"
          placeholder="Search events..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="w-full pl-9 pr-4"

        />
        {filters.search && (
          <IconButton aria-label="Close" variant="ghost" type="button"
            onClick={() => onFilterChange({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X size={12} />
          </IconButton>
        )}
      </div>

      {/* Selects */}
      <div className="flex flex-wrap gap-2">
        <Select aria-label="All Actions" wrapperClassName="w-auto min-w-0"
          value={filters.action || ''}
          onChange={(e) => onFilterChange({ action: e.target.value || undefined })}


        >
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
        </Select>

        <Select aria-label="All Categories" wrapperClassName="w-auto min-w-0"
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ category: e.target.value || undefined })}


        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>

        <Select aria-label="All Platforms" wrapperClassName="w-auto min-w-0"
          value={filters.platform || ''}
          onChange={(e) => onFilterChange({ platform: e.target.value || undefined })}
          className="capitalize"

        >
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <Calendar size={13} className="text-[var(--text-tertiary)]" />
        <Input aria-label="Filter date" wrapperClassName="w-auto min-w-0"
          type="date"
          value={filters.start_date || ''}
          onChange={(e) => onFilterChange({ start_date: e.target.value || undefined })}


        />
        <span className="text-[var(--text-tertiary)] text-[10px]">to</span>
        <Input aria-label="to" wrapperClassName="w-auto min-w-0"
          type="date"
          value={filters.end_date || ''}
          onChange={(e) => onFilterChange({ end_date: e.target.value || undefined })}


        />
      </div>
    </FilterBar>
  )
}
