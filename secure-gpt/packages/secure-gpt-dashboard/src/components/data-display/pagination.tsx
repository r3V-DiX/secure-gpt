// src/components/data-display/pagination.tsx
import { clsx } from 'clsx'
import type { Pagination as PaginationType } from '@/types'

interface PaginationProps {
  pagination: PaginationType
  onPageChange: (page: number) => void
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, page_size, total, total_pages, has_prev, has_next } = pagination
  if (total === 0) return null

  const start = (page - 1) * page_size + 1
  const end = Math.min(page * page_size, total)

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Showing{' '}
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {start}–{end}
        </span>{' '}
        of{' '}
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {total.toLocaleString()}
        </span>{' '}
        results
      </span>

      <div className="flex items-center gap-1.5">
        <PageBtn label="←" disabled={!has_prev} onClick={() => onPageChange(page - 1)} />
        <span className="px-3 py-1 text-xs font-semibold rounded-lg border"
          style={{
            background: 'var(--accent-light)',
            borderColor: 'var(--accent-border)',
            color: 'var(--accent-text)',
          }}>
          {page} / {total_pages}
        </span>
        <PageBtn label="→" disabled={!has_next} onClick={() => onPageChange(page + 1)} />
      </div>
    </div>
  )
}

function PageBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-8 h-7 flex items-center justify-center rounded-lg text-sm font-medium border transition-all duration-100',
        'disabled:opacity-40 disabled:cursor-not-allowed',
      )}
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-2)',
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-2)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
      }}
    >
      {label}
    </button>
  )
}