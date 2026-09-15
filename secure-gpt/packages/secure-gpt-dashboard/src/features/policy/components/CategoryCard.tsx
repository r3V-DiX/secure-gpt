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

import { ActionPicker } from './ActionSelector'
import { ChipInput } from './KeywordsEditor'
import { AddEditRuleModal, Toggle, FieldRow } from './PolicyManager'


// ─────────────────────────────────────────────────────────────────────────────
// Main CategoryCard
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  categoryName: string
  config: CategoryConfig
  isBuiltin: boolean
  animDelay: number
  readOnly?: boolean
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
    categoryName, config, isBuiltin, animDelay, readOnly,
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
                <span 
                  className="text-[11px] cursor-help" 
                  style={{ color: 'var(--text-tertiary)' }}
                  title={`Active fields: ${builtinRules.filter(r => config.ruleOverrides?.[r.id]?.action !== 'ALLOW').map(r => r.label).join(', ')}`}
                >
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
            {!isBuiltin && !readOnly && (
              <button onClick={onDelete} title="Delete category" aria-label="Delete category"
                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}>
                <Trash2 size={13} />
              </button>
            )}
            {config.enabled && (
              <button onClick={() => setExpanded(v => !v)} title={expanded ? "Collapse" : "Expand"} aria-label={expanded ? "Collapse" : "Expand"}
                className="p-1.5 rounded-lg transition-colors hover:bg-(--bg-surface-2)"
                style={{ color: 'var(--text-tertiary)' }}>
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            )}
            <Toggle on={config.enabled} onChange={onToggleEnabled} disabled={readOnly} />
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
              <ActionPicker value={config.action} onChange={onActionChange} disabled={readOnly} />
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
                      disabled={readOnly}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom rules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>Custom rules</p>
                {!readOnly && (
                  <button onClick={() => setAddRuleOpen(true)}
                    className="flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: 'var(--accent-text)' }}>
                    <Plus size={11} /> Add
                  </button>
                )}
              </div>
              {customRules.length === 0 ? (
                readOnly ? (
                  <p className="text-xs italic text-[var(--text-tertiary)] py-1">No custom regex rules defined.</p>
                ) : (
                  <button onClick={() => setAddRuleOpen(true)}
                    className="w-full py-4 text-xs border-2 border-dashed rounded-xl transition-all hover:border-(--accent-border) hover:text-(--accent-text)"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                    + Add a custom regex rule
                  </button>
                )
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
                        {!readOnly && (
                          <>
                            <button onClick={() => { setEditingRule(rule); setAddRuleOpen(true) }} title="Edit rule" aria-label="Edit rule"
                              className="p-1.5 rounded-lg hover:bg-neutral-500/10 transition-colors shrink-0"
                              style={{ color: 'var(--text-tertiary)' }}>
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => onDeleteCustomRule(rule.id)} title="Delete rule" aria-label="Delete rule"
                              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                              style={{ color: 'var(--text-tertiary)' }}>
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
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
                readOnly={readOnly}
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
                readOnly={readOnly}
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

