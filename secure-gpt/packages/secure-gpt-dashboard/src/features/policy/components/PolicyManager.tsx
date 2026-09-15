'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import type { CustomRule } from '@/types'

export interface AddEditRuleModalProps {
  category: string
  initialRule?: CustomRule
  onSave: (rule: Omit<CustomRule, 'id' | 'type'>) => void
  onClose: () => void
}

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

import { ACTION_LABEL, ACTION_COLORS, ACTIONS } from './ActionSelector'
import type { PolicyAction, RuleOverride } from '@/types'
import type { BuiltinRuleMeta } from '@securegpt/shared/constants'

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


export function AddEditRuleModal({
  category,
  initialRule,
  onSave,
  onClose,
}: AddEditRuleModalProps) {
  const [label, setLabel] = useState(initialRule?.label ?? '')
  const [pattern, setPattern] = useState(initialRule?.pattern ?? '')
  const [severity, setSeverity] = useState<CustomRule['severity']>(initialRule?.severity ?? 'medium')
  const [caseSensitive, setCaseSensitive] = useState(initialRule?.caseSensitive ?? false)
  const [maskingLabel, setMaskingLabel] = useState(initialRule?.maskingLabel ?? '')
  const [patternError, setPatternError] = useState<string | null>(null)

  const inp = {
    background: 'var(--bg-surface-2)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }

  const canAdd = label.trim() && pattern.trim() && !patternError

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {initialRule ? 'Edit Custom Rule' : 'New Custom Rule'}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {initialRule ? 'Modify this custom rule' : `Detect custom patterns in the ${category} category`}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Rule name</label>
          <input
            autoFocus
            className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
            style={inp}
            placeholder="e.g. Employee Badge ID"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Regex pattern</label>
            <a
              href="https://quickref.me/regex"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] hover:underline transition-colors"
              style={{ color: 'var(--accent-text)' }}
            >
              Regex Reference
            </a>
          </div>
          <input
            className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-mono"
            style={{ ...inp, borderColor: patternError ? 'var(--danger)' : 'var(--border)' }}
            placeholder="e.g. EMP-[0-9]{5}"
            value={pattern}
            onChange={e => {
              setPattern(e.target.value)
              try {
                new RegExp(e.target.value)
                setPatternError(null)
              } catch (err: any) {
                setPatternError(err.message)
              }
            }}
          />
          {patternError && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{patternError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Severity</label>
            <select
              className="w-full px-3 py-2 rounded-xl border outline-none text-sm appearance-none"
              style={inp}
              value={severity}
              onChange={e => setSeverity(e.target.value as any)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Masking label <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
              style={inp}
              placeholder="e.g. EMP_ID"
              value={maskingLabel}
              onChange={e => setMaskingLabel(e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <Toggle on={caseSensitive} onChange={setCaseSensitive} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Case sensitive</span>
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={!canAdd}
          onClick={() =>
            onSave({
              label,
              pattern,
              severity,
              caseSensitive,
              enabled: true,
              description: '',
              maskingLabel: maskingLabel.trim() || undefined,
              requireContext: false,
              triggers: [],
            })
          }
        >
          {initialRule ? 'Save Changes' : 'Add Rule'}
        </Button>
      </div>
    </div>
  )
}

import { Undo2, Save, AlertCircle } from 'lucide-react'

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
    <div
      className="fixed bottom-6 left-1/2 z-50 transition-all duration-300 ease-out"
      style={{
        transform: `translateX(-50%) translateY(${isDirty ? '0' : '96px'})`,
        opacity: isDirty ? 1 : 0,
        pointerEvents: isDirty ? 'auto' : 'none',
      }}
    >
      <div
        className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-2xl border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px var(--border)',
        }}
      >
        <span
          className="size-2 rounded-full shrink-0"
          style={{ background: 'var(--warning)', boxShadow: '0 0 6px var(--warning)' }}
        />
        <p className="text-xs font-medium pr-2" style={{ color: 'var(--text-secondary)' }}>
          {saving ? 'Publishing policy…' : 'You have unsaved changes'}
        </p>
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
      </div>
    </div>
  )
}

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

