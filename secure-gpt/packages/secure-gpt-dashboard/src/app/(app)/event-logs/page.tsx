'use client'
// src/app/(app)/logs/page.tsx
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { useEventLog } from '@/features/event-log/hooks/use-event-log'
import { EventLogTable } from '@/features/event-log/components/EventLogTable'
import { EventLogFilters } from '@/features/event-log/components/EventLogFilters'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { downloadLogsCsv } from '@/lib/utils/export'

export default function LogsPage() {
  const {
    data,
    pagination,
    filters,
    loading,
    error: loadError,
    updateFilters,
    setPage
  } = useEventLog()

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      // Pass all filters except pagination
      const { page: _page, page_size: _page_size, ...exportFilters } = filters
      await downloadLogsCsv(exportFilters)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const error = loadError || exportError

  return (
    <div className="w-full space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <PageHeader title={<>
            Event Log
          </>} description={<>
            Full history of all detections and actions taken
          </>} actions={<><Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          loading={exporting}
          icon={<Download size={13} />}
        >
          Export CSV
        </Button></>} />

      {error && (
        <div className="p-3 rounded-xl text-sm font-medium"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <EventLogFilters filters={filters} onFilterChange={updateFilters} />

      {/* Results summary */}
      {!loading && (
        <div className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Showing <span style={{ color: 'var(--text-secondary)' }}>{data.length}</span> of {pagination.total.toLocaleString()} events
        </div>
      )}

      {/* Table */}
      <EventLogTable
        data={data}
        pagination={pagination}
        loading={loading}
        onPageChange={setPage}
      />
    </div>
  )
}
