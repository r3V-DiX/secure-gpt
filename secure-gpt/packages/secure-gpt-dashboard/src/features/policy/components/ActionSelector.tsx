'use client'
// features/policy/components/ActionSelector.tsx
import type { PolicyAction } from '@/types'
import { ShieldBan, EyeOff, AlertTriangle, ShieldCheck } from 'lucide-react'

export const ACTIONS: PolicyAction[] = ['BLOCK', 'MASK', 'WARN_ALLOW', 'ALLOW']

export const ACTION_LABEL: Record<PolicyAction, string> = {
  BLOCK: 'Block',
  MASK: 'Mask',
  WARN_ALLOW: 'Warn',
  ALLOW: 'Allow',
}

export const ACTION_ICONS: Record<PolicyAction, React.ReactNode> = {
  BLOCK: <ShieldBan size={12} className="shrink-0" />,
  MASK: <EyeOff size={12} className="shrink-0" />,
  WARN_ALLOW: <AlertTriangle size={12} className="shrink-0" />,
  ALLOW: <ShieldCheck size={12} className="shrink-0" />,
}

export const ACTION_COLORS: Record<PolicyAction, { bg: string; border: string; text: string; lightBg: string }> = {
  BLOCK:      { bg: 'var(--danger-light)',  border: 'var(--danger-border)',  text: 'var(--danger)', lightBg: 'rgba(220, 38, 38, 0.12)' },
  MASK:       { bg: 'var(--warning-light)', border: 'var(--warning-border)', text: 'var(--warning)', lightBg: 'rgba(217, 119, 6, 0.12)' },
  WARN_ALLOW: { bg: 'var(--info-light)',    border: 'var(--info-border)',    text: 'var(--info)', lightBg: 'rgba(2, 132, 199, 0.12)' },
  ALLOW:      { bg: 'var(--success-light)', border: 'var(--success-border)', text: 'var(--success)', lightBg: 'rgba(5, 150, 105, 0.12)' },
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
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl border"
      style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
    >
      {ACTIONS.map(a => {
        const ac = ACTION_COLORS[a]
        const active = value === a
        return (
          <button
            key={a}
            type="button"
            onClick={disabled ? undefined : () => onChange(a)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all select-none ${
              disabled ? 'cursor-default opacity-50' : 'cursor-pointer'
            }`}
            style={{
              background: active ? ac.bg : 'transparent',
              borderColor: active ? ac.border : 'transparent',
              borderWidth: 1,
              borderStyle: 'solid',
              color: active ? ac.text : 'var(--text-secondary)',
              boxShadow: active ? `0 1px 4px ${ac.bg}` : 'none',
            }}
          >
            <span style={{ color: active ? ac.text : 'var(--text-tertiary)' }}>
              {ACTION_ICONS[a]}
            </span>
            <span>{ACTION_LABEL[a]}</span>
          </button>
        )
      })}
    </div>
  )
}


