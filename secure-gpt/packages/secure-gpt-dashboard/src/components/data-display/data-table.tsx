'use client'

// src/components/data-display/data-table.tsx
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui'
import { clsx } from 'clsx'

import { Inbox } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state/EmptyState'

export interface Column<T> {
  key: string
  label: React.ReactNode
  width?: string
  headerClassName?: string
  cellClassName?: string
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
      <Table className="w-full text-xs border-collapse">
        <TableHead>
          <TableRow style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <TableHeaderCell
                key={col.key}
                style={{ width: col.width, background: 'var(--bg-surface-2)' }}
                className={col.headerClassName}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>{col.label}</span>
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {columns.map(col => (
                  <TableCell key={col.key} className="px-4 py-3">
                    <div className="skeleton h-4 w-3/4" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="px-4 py-8">
                <EmptyState
                  icon={Inbox}
                  title="No records found"
                  description={emptyMessage}
                  compact
                />
              </TableCell>
            </TableRow>
          ) : (
            data.map(row => (
              <TableRow
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
                  <TableCell key={col.key} className={col.cellClassName}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
