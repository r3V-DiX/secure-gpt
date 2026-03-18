'use client'

import { useEventLog } from '@/features/event-log/hooks/use-event-log'
import { DataTable, type Column } from '@/components/data-display/data-table'
import { Pagination } from '@/components/data-display/pagination'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { PII_CATEGORY_LABELS, POLICY_ACTIONS, PII_CATEGORIES, ALL_PLATFORMS, PLATFORM_LABELS } from '@securegpt/shared/constants'
import type { AuditLog } from '@securegpt/shared/types'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'

const ACTION_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
  BLOCK: 'danger', MASK: 'warning', WARN_ALLOW: 'info', ALLOW: 'success',
}

const COLUMNS: Column<AuditLog>[] = [
  {
    key: 'timestamp', label: 'Time', width: '160px',
    render: (r) => <span className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleString()}</span>,
  },
  {
    key: 'action', label: 'Action', width: '110px',
    render: (r) => <Badge variant={ACTION_BADGE[r.actionTaken] ?? 'neutral'}>{r.actionTaken}</Badge>,
  },
  {
    key: 'category', label: 'Category', width: '140px',
    render: (r) => <span className="text-xs font-medium text-gray-700">{PII_CATEGORY_LABELS[r.categoryTriggered as PIICategory] ?? r.categoryTriggered}</span>,
  },
  {
    key: 'type', label: 'Detection type',
    render: (r) => <span className="text-xs text-gray-500 font-mono">{r.detectionType.replace(/_/g, ' ')}</span>,
  },
  {
    key: 'platform', label: 'Platform', width: '120px',
    render: (r) => <span className="text-xs text-gray-600 capitalize">{r.llmPlatform}</span>,
  },
  {
    key: 'tier', label: 'Tier', width: '80px',
    render: (r) => <Badge variant="neutral">{r.detectionTier}</Badge>,
  },
  {
    key: 'count', label: 'Items', width: '60px',
    render: (r) => <span className="text-xs font-semibold text-gray-700">{r.matchCount}</span>,
  },
]

export default function EventLogPage() {
  const { data, pagination, filters, loading, updateFilters, setPage } = useEventLog()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="sg-page-title">Event Log</h1>
          <p className="sg-page-subtitle">Full audit trail of all detection events</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open('/api/backend/reports/export/csv', '_blank')}
        >
          Export CSV ↓
        </Button>
      </div>

      {/* Filters */}
      <div className="sg-card p-4 flex flex-wrap gap-3">
        <select
          className="sg-input w-40"
          value={filters.action ?? ''}
          onChange={(e) => updateFilters({ action: e.target.value || undefined })}
        >
          <option value="">All actions</option>
          {Object.keys(POLICY_ACTIONS).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          className="sg-input w-44"
          value={filters.category ?? ''}
          onChange={(e) => updateFilters({ category: e.target.value || undefined })}
        >
          <option value="">All categories</option>
          {Object.keys(PII_CATEGORIES).map((c) => (
            <option key={c} value={c}>{PII_CATEGORY_LABELS[c as PIICategory]}</option>
          ))}
        </select>

        <select
          className="sg-input w-44"
          value={filters.platform ?? ''}
          onChange={(e) => updateFilters({ platform: e.target.value || undefined })}
        >
          <option value="">All platforms</option>
          {ALL_PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </select>

        <input
          type="date"
          className="sg-input w-40"
          value={filters.start_date ?? ''}
          onChange={(e) => updateFilters({ start_date: e.target.value || undefined })}
        />
        <input
          type="date"
          className="sg-input w-40"
          value={filters.end_date ?? ''}
          onChange={(e) => updateFilters({ end_date: e.target.value || undefined })}
        />

        {(filters.action || filters.category || filters.platform || filters.start_date) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFilters({ action: undefined, category: undefined, platform: undefined, start_date: undefined, end_date: undefined })}
          >
            Clear filters
          </Button>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        rowKey={(r) => r.eventId}
        emptyMessage="No events found for the selected filters"
      />

      {pagination.total > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.total_pages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
