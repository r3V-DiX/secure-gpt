'use client'
// src/features/event-log/components/EventLogFilters.tsx
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
    <div className="flex flex-wrap items-center gap-3 py-1">
      {/* Domain Search */}
      <div className="relative group flex-1 min-w-[240px] max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent)] transition-colors" />
        <input
          type="text"
          placeholder="Search by domain..."
          value={filters.domain || ''}
          onChange={(e) => onFilterChange({ domain: e.target.value })}
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none transition-all"
          style={{ 
            background: 'var(--bg-surface)', 
            borderColor: 'var(--border)',
            color: 'var(--text-primary)'
          }}
        />
        {filters.domain && (
          <button 
            onClick={() => onFilterChange({ domain: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-[var(--bg-surface-3)] text-[var(--text-tertiary)]"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Selects */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.action || ''}
          onChange={(e) => onFilterChange({ action: e.target.value || undefined })}
          className="px-3 py-2 rounded-xl border text-xs font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
        </select>

        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
          className="px-3 py-2 rounded-xl border text-xs font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filters.platform || ''}
          onChange={(e) => onFilterChange({ platform: e.target.value || undefined })}
          className="px-3 py-2 rounded-xl border text-xs font-medium outline-none cursor-pointer capitalize"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <Calendar size={13} className="text-[var(--text-tertiary)]" />
        <input 
          type="date" 
          value={filters.start_date || ''}
          onChange={(e) => onFilterChange({ start_date: e.target.value || undefined })}
          className="bg-transparent text-[11px] font-medium outline-none"
          style={{ color: 'var(--text-secondary)' }}
        />
        <span className="text-[var(--text-tertiary)] text-[10px]">to</span>
        <input 
          type="date" 
          value={filters.end_date || ''}
          onChange={(e) => onFilterChange({ end_date: e.target.value || undefined })}
          className="bg-transparent text-[11px] font-medium outline-none"
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
    </div>
  )
}
