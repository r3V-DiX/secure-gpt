'use client'
// src/app/(app)/logs/page.tsx
import { useEventLog } from '@/features/event-log/hooks/use-event-log'
import { EventLogTable } from '@/features/event-log/components/EventLogTable'
import { EventLogFilters } from '@/features/event-log/components/EventLogFilters'
import { Download } from 'lucide-react'

export default function LogsPage() {
  const { 
    data, 
    pagination, 
    filters, 
    loading, 
    error, 
    updateFilters, 
    setPage 
  } = useEventLog()

  const handleExport = () => {
    // Backend endpoint /api/v1/logs/export returns CSV
    window.location.href = '/api/v1/logs/export'
  }

  return (
    <div className="max-w-[1200px] space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Event Log
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Full history of all detections and actions taken
          </p>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:brightness-110 active:scale-95"
          style={{ 
            background: 'var(--accent)', 
            borderColor: 'var(--accent-border)', 
            color: 'white' 
          }}
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

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
