'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import { AlertCircle } from 'lucide-react'
import { ACTION_LABEL, ACTION_COLORS, ACTIONS } from './ActionSelector'
import type { PolicyAction } from '@/types'

export function AddCategoryModal({
  isOrgVerified = true,
  onAdd,
  onClose,
}: {
  isOrgVerified?: boolean
  onAdd: (name: string, action: PolicyAction) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [action, setAction] = useState<PolicyAction>('WARN_ALLOW')

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>New Category</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Create a custom detection category</p>
      </div>

      {!isOrgVerified && (
        <div
          className="p-3.5 text-xs rounded-xl flex items-start gap-2.5"
          style={{ background: 'var(--warning-light)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Domain Verification Required</p>
            <p className="mt-0.5 text-[11px] opacity-90">
              You cannot add custom detection categories until your corporate domain is verified.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Name</label>
        <input
          autoFocus
          disabled={!isOrgVerified}
          className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          placeholder="e.g. Medical Records"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && isOrgVerified && onAdd(name, action)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          When detected, what should happen?
        </label>
        <div className="space-y-2">
          {ACTIONS.map(a => {
            const ac = ACTION_COLORS[a]
            const active = action === a
            const desc: Record<PolicyAction, string> = {
              BLOCK: 'Stop the message from being sent',
              MASK: 'Replace sensitive text before sending',
              WARN_ALLOW: 'Warn the user, let them decide',
              ALLOW: 'Let it pass, log it silently',
            }
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAction(a)}
                disabled={!isOrgVerified}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: active ? ac.bg : 'var(--bg-surface-2)',
                  borderColor: active ? ac.border : 'var(--border)',
                }}
              >
                <span className="text-xs font-bold w-12 shrink-0" style={{ color: ac.text }}>
                  {ACTION_LABEL[a]}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {desc[a]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => onAdd(name, action)}
          disabled={!name.trim() || !isOrgVerified}
        >
          Create
        </Button>
      </div>
    </div>
  )
}
