'use client'
// features/policy/components/ActionSelector.tsx
import type { PolicyAction } from '@/types'

export const ACTIONS: PolicyAction[] = ['BLOCK', 'MASK', 'WARN_ALLOW', 'ALLOW']

export const ACTION_LABEL: Record<PolicyAction, string> = {
  BLOCK: 'Block',
  MASK: 'Mask',
  WARN_ALLOW: 'Warn',
  ALLOW: 'Allow',
}

export const ACTION_COLORS: Record<PolicyAction, { bg: string; border: string; text: string }> = {
  BLOCK:      { bg: 'var(--danger-light)',  border: 'var(--danger-border)',  text: 'var(--danger)' },
  MASK:       { bg: 'var(--warning-light)', border: 'var(--warning-border)', text: 'var(--warning)' },
  WARN_ALLOW: { bg: 'var(--info-light)',    border: 'var(--info-border)',    text: 'var(--info)' },
  ALLOW:      { bg: 'var(--success-light)', border: 'var(--success-border)', text: 'var(--success)' },
}

export function ActionPicker({
  value,
  onChange,
  disabled,
}: {
  value: PolicyAction
  onChange: (a: PolicyAction) => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-1.5 font-sans">
      {ACTIONS.map(a => {
        const ac = ACTION_COLORS[a]
        const active = value === a
        return (
          <button
            key={a}
            type="button"
            onClick={disabled ? undefined : () => onChange(a)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            }`}
            style={{
              background: active ? ac.bg : 'transparent',
              borderColor: active ? ac.border : 'var(--border)',
              color: active ? ac.text : 'var(--text-tertiary)',
              opacity: disabled && !active ? 0.5 : 1,
            }}
          >
            {ACTION_LABEL[a]}
          </button>
        )
      })}
    </div>
  )
}

