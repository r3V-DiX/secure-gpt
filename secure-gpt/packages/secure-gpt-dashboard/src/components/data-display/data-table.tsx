// src/components/data-display/data-table.tsx
'use client'
import { clsx } from 'clsx'

import { Inbox } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state/EmptyState'

export interface Column<T> {
  key: string
  label: string
  width?: string
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  columns, data, loading, emptyMessage = 'No data found', rowKey, onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-md border"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width, background: 'var(--bg-surface-2)' }}
                className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
              >
                <span style={{ color: 'var(--text-tertiary)' }}>{col.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="skeleton h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8">
                <EmptyState
                  icon={Inbox}
                  title="No records found"
                  description={emptyMessage}
                  className="border-none !bg-transparent p-4"
                />
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'transition-colors duration-75',
                  onRowClick && 'cursor-pointer',
                )}
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => {
                  if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-surface-2)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLTableRowElement).style.background = ''
                }}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-3.5 py-2.5 whitespace-nowrap text-[var(--text-secondary)]">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}