'use client'

import React from 'react'
import { ACTION_LABEL, ACTION_COLORS, ACTIONS } from './ActionSelector'
import type { PolicyAction, RuleOverride } from '@/types'
import type { BuiltinRuleMeta } from '@securegpt/shared/constants'

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : () => onChange(!on)}
      disabled={disabled}
      className={`relative shrink-0 rounded-full transition-all duration-200 ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      style={{
        width: 40,
        height: 22,
        background: on ? 'var(--accent)' : 'var(--bg-surface-3)',
        boxShadow: on && !disabled ? '0 0 8px var(--accent-glow)' : 'none',
      }}
    >
      <span
        className="absolute top-1 left-1 size-3.5 bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'var(--danger)',
  high: 'var(--warning)',
  medium: 'var(--info)',
  low: 'var(--success)',
}

export function FieldRow({
  rule,
  override,
  categoryAction,
  onToggle,
  onActionChange,
  disabled,
}: {
  rule: BuiltinRuleMeta
  override: RuleOverride | undefined
  categoryAction: PolicyAction
  onToggle: (enabled: boolean) => void
  onActionChange: (a: PolicyAction | null) => void
  disabled?: boolean
}) {
  const enabled = override?.enabled ?? true
  const overrideAction = override?.action ?? null

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{
        background: enabled ? 'var(--bg-surface-2)' : 'transparent',
        opacity: enabled ? 1 : 0.45,
        border: '1px solid',
        borderColor: enabled ? 'var(--border-2)' : 'var(--border)',
      }}
    >
      <span
        className="size-2 rounded-full shrink-0"
        style={{ background: SEVERITY_DOT[rule.severity] ?? 'var(--text-tertiary)' }}
      />

      <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
        {rule.label}
      </span>

      {enabled && (
        <select
          value={overrideAction ?? ''}
          onChange={e => onActionChange((e.target.value as PolicyAction) || null)}
          disabled={disabled}
          className={`text-[11px] font-semibold rounded-lg px-2 py-1 border outline-none transition-all ${
            disabled ? 'cursor-default' : 'cursor-pointer'
          }`}
          style={{
            background: overrideAction ? ACTION_COLORS[overrideAction].bg : 'var(--bg-surface-3)',
            borderColor: overrideAction ? ACTION_COLORS[overrideAction].border : 'var(--border)',
            color: overrideAction ? ACTION_COLORS[overrideAction].text : 'var(--text-tertiary)',
          }}
        >
          <option value="">Category default ({ACTION_LABEL[categoryAction]})</option>
          {ACTIONS.map(a => (
            <option key={a} value={a}>
              {ACTION_LABEL[a]}
            </option>
          ))}
        </select>
      )}

      <Toggle on={enabled} onChange={onToggle} disabled={disabled} />
    </div>
  )
}

export { AddEditRuleModal, type AddEditRuleModalProps } from './AddEditRuleModal'
export { SaveBar } from './SaveBar'
export { AddCategoryModal } from './AddCategoryModal'
