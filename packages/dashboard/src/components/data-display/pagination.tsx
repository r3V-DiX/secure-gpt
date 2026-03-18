'use client'

import React from 'react'
import { clsx } from 'clsx'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-1 pt-3">
      <p className="text-xs text-gray-400">
        Showing <span className="font-medium text-gray-600">{start}–{end}</span> of{' '}
        <span className="font-medium text-gray-600">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(1)} disabled={page === 1} label="«" />
        <PageButton onClick={() => onPageChange(page - 1)} disabled={page === 1} label="‹" />

        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-gray-400">…</span>
          ) : (
            <PageButton
              key={p}
              onClick={() => onPageChange(p as number)}
              active={p === page}
              label={String(p)}
            />
          )
        )}

        <PageButton onClick={() => onPageChange(page + 1)} disabled={page === totalPages} label="›" />
        <PageButton onClick={() => onPageChange(totalPages)} disabled={page === totalPages} label="»" />
      </div>
    </div>
  )
}

function PageButton({
  onClick, disabled, active, label,
}: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'min-w-[30px] h-7 px-2 rounded-lg text-xs font-medium transition-all duration-100',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {label}
    </button>
  )
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}
