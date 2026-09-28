'use client'

import React from 'react'
import { Undo2, Save } from 'lucide-react'
import { FloatingActionBar } from '@/components/shared/FloatingActionBar'

export function SaveBar({
  isDirty,
  saving,
  onSave,
  onDiscard,
}: {
  isDirty: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <FloatingActionBar
      visible={isDirty}
      indicatorColor="var(--warning)"
      label={saving ? 'Publishing policy…' : 'You have unsaved changes'}
    >
      <button
        type="button"
        onClick={onDiscard}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 hover:bg-(--bg-surface-2) cursor-pointer"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <Undo2 size={11} /> Discard
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
        style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px var(--accent-glow)' }}
      >
        {saving ? (
          <span className="size-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <Save size={11} />
        )}
        {saving ? 'Saving…' : 'Save & Publish'}
      </button>
    </FloatingActionBar>
  )
}
