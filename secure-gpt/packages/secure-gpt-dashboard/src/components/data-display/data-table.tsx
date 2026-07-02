// src/components/data-display/data-table.tsx
'use client'
import { clsx } from 'clsx'

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
    <div className="w-full overflow-x-auto rounded-2xl border"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width, background: 'var(--bg-surface-2)' }}
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap"
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
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl opacity-30">📭</span>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {emptyMessage}
                  </p>
                </div>
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
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap"
                    style={{ color: 'var(--text-secondary)' }}>
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