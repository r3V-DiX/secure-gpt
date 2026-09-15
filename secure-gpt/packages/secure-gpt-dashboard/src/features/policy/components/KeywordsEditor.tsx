'use client'

import React from 'react'
import { X } from 'lucide-react'

export interface ChipInputProps {
  label: string
  hint: string
  placeholder: string
  items: string[]
  draft: string
  setDraft: (v: string) => void
  onAdd: (v: string) => void
  onRemove: (v: string) => void
  readOnly?: boolean
}

export function ChipInput({
  label,
  hint,
  placeholder,
  items,
  draft,
  setDraft,
  onAdd,
  onRemove,
  readOnly,
}: ChipInputProps) {
  const commit = () => {
    if (readOnly) return
    const v = draft.trim()
    if (v && !items.includes(v)) {
      onAdd(v)
      setDraft('')
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-[10px] mb-2" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
      {!readOnly && (
        <div className="flex gap-1.5 mb-2">
          <input
            className="flex-1 px-2.5 py-1.5 rounded-lg border outline-none text-xs"
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            placeholder={placeholder}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && commit()}
          />
          <button
            type="button"
            onClick={commit}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }}
          >
            Add
          </button>
        </div>
      )}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {items.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-lg text-[11px] font-medium border"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {item}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  title="Remove item"
                  aria-label="Remove item"
                  className="size-3.5 flex items-center justify-center rounded hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X size={9} />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        readOnly && <span className="text-xs italic text-[var(--text-tertiary)]">None added</span>
      )}
    </div>
  )
}
