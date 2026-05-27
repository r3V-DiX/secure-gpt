'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Plus, X, Pencil } from 'lucide-react'
import { ACTION_LABEL, ACTION_COLORS, ACTIONS } from './ActionSelector'
import { Button } from '@/components/ui/button/button'
import { Modal } from '@/components/ui/modal/modal'
import type { CategoryConfig, PolicyAction, CustomRule, RuleOverride } from '@/types'
import { BUILTIN_RULES_BY_CATEGORY, type BuiltinRuleMeta } from '@securegpt/shared/constants'

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_DOT: Record<string, string> = {
  critical: 'var(--danger)',
  high: 'var(--warning)',
  medium: 'var(--info)',
  low: 'var(--success)',
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  FINANCIAL:    { icon: '💳', color: 'var(--warning)' },
  PII:          { icon: '👤', color: 'var(--info)' },
  CONFIDENTIAL: { icon: '🔐', color: 'var(--danger)' },
  IP:           { icon: '💡', color: 'var(--success)' },
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative shrink-0 rounded-full transition-all duration-200"
      style={{
        width: 40, height: 22,
        background: on ? 'var(--accent)' : 'var(--bg-surface-3)',
        boxShadow: on ? '0 0 8px var(--accent-glow)' : 'none',
      }}
    >
      <span
        className="absolute top-1 left-1 size-3.5 bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Action selector — 4 pill buttons
// ─────────────────────────────────────────────────────────────────────────────
function ActionPicker({ value, onChange }: { value: PolicyAction; onChange: (a: PolicyAction) => void }) {
  return (
    <div className="flex gap-1.5">
      {ACTIONS.map(a => {
        const ac = ACTION_COLORS[a]
        const active = value === a
        return (
          <button key={a} onClick={() => onChange(a)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{
              background: active ? ac.bg : 'transparent',
              borderColor: active ? ac.border : 'var(--border)',
              color: active ? ac.text : 'var(--text-tertiary)',
            }}>
            {ACTION_LABEL[a]}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Detection field row (built-in rule) — compact, flat
// ─────────────────────────────────────────────────────────────────────────────
function FieldRow({ rule, override, categoryAction, onToggle, onActionChange }: {
  rule: BuiltinRuleMeta
  override: RuleOverride | undefined
  categoryAction: PolicyAction
  onToggle: (enabled: boolean) => void
  onActionChange: (a: PolicyAction | null) => void
}) {
  const enabled = override?.enabled !== undefined ? override.enabled : true
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
      {/* Severity dot */}
      <span className="size-2 rounded-full shrink-0"
        style={{ background: SEVERITY_DOT[rule.severity] ?? 'var(--text-tertiary)' }} />

      {/* Name */}
      <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
        {rule.label}
      </span>

      {/* Override action dropdown — only visible when enabled */}
      {enabled && (
        <select
          value={overrideAction ?? ''}
          onChange={e => onActionChange((e.target.value as PolicyAction) || null)}
          className="text-[11px] font-semibold rounded-lg px-2 py-1 border outline-none cursor-pointer transition-all"
          style={{
            background: overrideAction ? ACTION_COLORS[overrideAction].bg : 'var(--bg-surface-3)',
            borderColor: overrideAction ? ACTION_COLORS[overrideAction].border : 'var(--border)',
            color: overrideAction ? ACTION_COLORS[overrideAction].text : 'var(--text-tertiary)',
          }}
        >
          <option value="">Category default</option>
          {ACTIONS.map(a => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
        </select>
      )}

      {/* Toggle */}
      <Toggle on={enabled} onChange={onToggle} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add/Edit Custom Rule modal
// ─────────────────────────────────────────────────────────────────────────────
function AddEditRuleModal({ category, initialRule, onSave, onClose }: {
  category: string
  initialRule?: CustomRule
  onSave: (rule: Omit<CustomRule, 'id' | 'type'>) => void
  onClose: () => void
}) {
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
          <input autoFocus className="w-full px-3 py-2 rounded-xl border outline-none text-sm" style={inp}
            placeholder="e.g. Employee Badge ID" value={label} onChange={e => setLabel(e.target.value)} />
        </div>

        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Regex pattern</label>
          <input className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-mono" style={{ ...inp, borderColor: patternError ? 'var(--danger)' : 'var(--border)' }}
            placeholder="e.g. EMP-[0-9]{5}" value={pattern}
            onChange={e => {
              setPattern(e.target.value)
              try { new RegExp(e.target.value); setPatternError(null) }
              catch (err: any) { setPatternError(err.message) }
            }} />
          {patternError && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{patternError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Severity</label>
            <select className="w-full px-3 py-2 rounded-xl border outline-none text-sm appearance-none" style={inp}
              value={severity} onChange={e => setSeverity(e.target.value as any)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Masking label <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></label>
            <input className="w-full px-3 py-2 rounded-xl border outline-none text-sm" style={inp}
              placeholder="e.g. EMP_ID" value={maskingLabel} onChange={e => setMaskingLabel(e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <Toggle on={caseSensitive} onChange={setCaseSensitive} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Case sensitive</span>
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" disabled={!canAdd}
          onClick={() => onSave({ label, pattern, severity, caseSensitive, enabled: true, description: '', maskingLabel: maskingLabel.trim() || undefined, requireContext: false, triggers: [] })}>
          {initialRule ? 'Save Changes' : 'Add Rule'}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main CategoryCard
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  categoryName: string
  config: CategoryConfig
  isBuiltin: boolean
  animDelay: number
  onToggleEnabled: (enabled: boolean) => void
  onActionChange: (action: PolicyAction) => void
  onRuleOverride: (ruleId: string, override: RuleOverride) => void
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (keyword: string) => void
  onAddAllowlist: (pattern: string) => void
  onRemoveAllowlist: (pattern: string) => void
  onAddCustomRule: (rule: Omit<CustomRule, 'id' | 'type'>) => void
  onUpdateCustomRule: (ruleId: string, rule: Omit<CustomRule, 'id' | 'type'>) => void
  onDeleteCustomRule: (ruleId: string) => void
  onDelete: () => void
}

export function CategoryCard(props: Props) {
  const {
    categoryName, config, isBuiltin, animDelay,
    onToggleEnabled, onActionChange, onRuleOverride,
    onAddKeyword, onRemoveKeyword, onAddAllowlist, onRemoveAllowlist,
    onAddCustomRule, onUpdateCustomRule, onDeleteCustomRule, onDelete,
  } = props

  const [expanded, setExpanded] = useState(false)
  const [addRuleOpen, setAddRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CustomRule | undefined>(undefined)
  const [kwDraft, setKwDraft] = useState('')
  const [allowDraft, setAllowDraft] = useState('')

  const meta = CATEGORY_META[categoryName] ?? { icon: '📁', color: 'var(--text-tertiary)' }
  const builtinRules = BUILTIN_RULES_BY_CATEGORY[categoryName] ?? []
  const customRules = config.customRules ?? []
  const keywords = config.customKeywords ?? []
  const allowlist = config.allowlist ?? []
  const ac = ACTION_COLORS[config.action]

  const disabledCount = builtinRules.filter(r => config.ruleOverrides?.[r.id]?.enabled === false).length

  return (
    <>
      <div
        className="rounded-2xl border overflow-hidden animate-fade-in transition-all duration-200"
        style={{
          background: 'var(--bg-surface)',
          borderColor: config.enabled ? 'var(--border-2)' : 'var(--border)',
          boxShadow: config.enabled ? 'var(--shadow-md)' : 'none',
          opacity: config.enabled ? 1 : 0.65,
          animationDelay: `${animDelay}ms`,
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4">
          {/* Icon */}
          <span className="text-2xl leading-none shrink-0">{meta.icon}</span>

          {/* Name + action badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{categoryName}</span>
              {config.enabled && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ background: ac.bg, borderColor: ac.border, color: ac.text }}>
                  {ACTION_LABEL[config.action]}
                </span>
              )}
              {config.enabled && builtinRules.length > 0 && (
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {builtinRules.length - disabledCount}/{builtinRules.length} fields active
                </span>
              )}
            </div>
            {customRules.length > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                +{customRules.length} custom rule{customRules.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {!isBuiltin && (
              <button onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}>
                <Trash2 size={13} />
              </button>
            )}
            {config.enabled && (
              <button onClick={() => setExpanded(v => !v)}
                className="p-1.5 rounded-lg transition-colors hover:bg-(--bg-surface-2)"
                style={{ color: 'var(--text-tertiary)' }}>
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            )}
            <Toggle on={config.enabled} onChange={onToggleEnabled} />
          </div>
        </div>

        {/* ── Expanded body ── */}
        {config.enabled && expanded && (
          <div className="border-t px-5 py-4 space-y-5" style={{ borderColor: 'var(--border)' }}>

            {/* Action picker */}
            <div>
              <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>
                What happens when this category is detected?
              </p>
              <ActionPicker value={config.action} onChange={onActionChange} />
            </div>

            {/* Detection fields */}
            {builtinRules.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Detection fields — toggle individual fields or override their action
                </p>
                <div className="space-y-1.5">
                  {builtinRules.map(rule => (
                    <FieldRow
                      key={rule.id}
                      rule={rule}
                      override={config.ruleOverrides?.[rule.id]}
                      categoryAction={config.action}
                      onToggle={enabled => onRuleOverride(rule.id, { enabled })}
                      onActionChange={a => onRuleOverride(rule.id, { action: a ?? undefined })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom rules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>Custom rules</p>
                <button onClick={() => setAddRuleOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold transition-colors"
                  style={{ color: 'var(--accent-text)' }}>
                  <Plus size={11} /> Add
                </button>
              </div>
              {customRules.length === 0 ? (
                <button onClick={() => setAddRuleOpen(true)}
                  className="w-full py-4 text-xs border-2 border-dashed rounded-xl transition-all hover:border-(--accent-border) hover:text-(--accent-text)"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                  + Add a custom regex rule
                </button>
              ) : (
                <div className="space-y-1.5">
                  {customRules.map(rule => {
                    const sc = SEVERITY_DOT[rule.severity] ?? 'var(--text-tertiary)'
                    return (
                      <div key={rule.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
                        style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                        <span className="size-2 rounded-full shrink-0" style={{ background: sc }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{rule.label}</p>
                          <code className="text-[10px] block truncate" style={{ color: 'var(--text-tertiary)' }}>/{rule.pattern}/</code>
                        </div>
                        <button onClick={() => { setEditingRule(rule); setAddRuleOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-neutral-500/10 transition-colors shrink-0"
                          style={{ color: 'var(--text-tertiary)' }}>
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => onDeleteCustomRule(rule.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                          style={{ color: 'var(--text-tertiary)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChipInput
                label="Extra keywords"
                hint="Flag these words even without a pattern match"
                placeholder="e.g. confidential"
                items={keywords}
                draft={kwDraft}
                setDraft={setKwDraft}
                onAdd={onAddKeyword}
                onRemove={onRemoveKeyword}
              />
              <ChipInput
                label="Allowlist"
                hint="Never flag these specific values"
                placeholder="e.g. test@example.com"
                items={allowlist}
                draft={allowDraft}
                setDraft={setAllowDraft}
                onAdd={onAddAllowlist}
                onRemove={onRemoveAllowlist}
              />
            </div>
          </div>
        )}
      </div>

      <Modal open={addRuleOpen} onClose={() => { setAddRuleOpen(false); setEditingRule(undefined) }} size="sm">
        <AddEditRuleModal
          category={categoryName}
          initialRule={editingRule}
          onSave={rule => {
            if (editingRule) {
              onUpdateCustomRule(editingRule.id, rule)
            } else {
              onAddCustomRule(rule)
            }
            setAddRuleOpen(false)
            setEditingRule(undefined)
          }}
          onClose={() => { setAddRuleOpen(false); setEditingRule(undefined) }}
        />
      </Modal>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Chip input (keywords / allowlist)
// ─────────────────────────────────────────────────────────────────────────────
function ChipInput({ label, hint, placeholder, items, draft, setDraft, onAdd, onRemove }: {
  label: string; hint: string; placeholder: string
  items: string[]; draft: string; setDraft: (v: string) => void
  onAdd: (v: string) => void; onRemove: (v: string) => void
}) {
  const commit = () => {
    const v = draft.trim()
    if (v && !items.includes(v)) { onAdd(v); setDraft('') }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-[10px] mb-2" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
      <div className="flex gap-1.5 mb-2">
        <input
          className="flex-1 px-2.5 py-1.5 rounded-lg border outline-none text-xs"
          style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          placeholder={placeholder}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && commit()}
        />
        <button onClick={commit}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }}>
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {items.map(item => (
            <span key={item}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-[11px] font-medium border"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {item}
              <button onClick={() => onRemove(item)}
                className="size-3.5 flex items-center justify-center rounded hover:text-red-400 transition-colors">
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
