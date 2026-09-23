'use client'
import { useState } from 'react'
import {
  Trash2,
  Plus,
  Pencil,
  Sliders,
  Shield,
  Key,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { ACTION_LABEL, ACTION_COLORS, ACTION_ICONS } from './ActionSelector'
import { Button } from '@/components/ui/button/button'
import { Modal } from '@/components/ui/modal/modal'
import type { CategoryConfig, PolicyAction, CustomRule, RuleOverride } from '@/types'
import { BUILTIN_RULES_BY_CATEGORY } from '@securegpt/shared/constants'
import { ActionPicker } from './ActionSelector'
import { ChipInput } from './KeywordsEditor'
import { AddEditRuleModal, Toggle, FieldRow } from './PolicyManager'
import { CardIcon, UserProfileIcon, SecurityLock, IdeaIcon, FolderIcon } from '@/components/icons'

const CATEGORY_META: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
  FINANCIAL: {
    icon: <CardIcon size={18} className="text-[var(--accent)]" />,
    title: 'Financial & Payment Data',
    desc: 'Credit cards, IBANs, bank accounts, routing numbers, and cryptowallets',
  },
  PII: {
    icon: <UserProfileIcon size={18} className="text-[var(--info)]" />,
    title: 'Personally Identifiable Info',
    desc: 'Social security numbers, passports, phone numbers, emails, and full names',
  },
  CONFIDENTIAL: {
    icon: <SecurityLock size={18} className="text-[var(--warning)]" />,
    title: 'Secrets & API Credentials',
    desc: 'API keys, private RSA certificates, JWT tokens, and database credentials',
  },
  IP: {
    icon: <IdeaIcon size={18} className="text-[var(--violet)]" />,
    title: 'Intellectual Property & Code',
    desc: 'Proprietary source code, internal schemas, patents, and internal trade secrets',
  },
}

interface PolicyWorkspaceProps {
  categories: string[]
  configCategories: Record<string, CategoryConfig>
  isBuiltin: (cat: string) => boolean
  isAdmin: boolean
  isOrgVerified: boolean
  onToggleCategoryEnabled: (cat: string, enabled: boolean) => void
  onCategoryActionChange: (cat: string, action: PolicyAction) => void
  onRuleOverride: (cat: string, ruleId: string, override: RuleOverride) => void
  onAddKeyword: (cat: string, keyword: string) => void
  onRemoveKeyword: (cat: string, keyword: string) => void
  onAddAllowlist: (cat: string, pattern: string) => void
  onRemoveAllowlist: (cat: string, pattern: string) => void
  onAddCustomRule: (cat: string, rule: Omit<CustomRule, 'id' | 'type'>) => void
  onUpdateCustomRule: (cat: string, ruleId: string, rule: Omit<CustomRule, 'id' | 'type'>) => void
  onDeleteCustomRule: (cat: string, ruleId: string) => void
  onDeleteCategory: (cat: string) => void
  onOpenNewCategory: () => void
}

export function CategoryWorkspace(props: PolicyWorkspaceProps) {
  const {
    categories,
    configCategories,
    isBuiltin,
    isAdmin,
    isOrgVerified,
    onToggleCategoryEnabled,
    onCategoryActionChange,
    onRuleOverride,
    onAddKeyword,
    onRemoveKeyword,
    onAddAllowlist,
    onRemoveAllowlist,
    onAddCustomRule,
    onUpdateCustomRule,
    onDeleteCustomRule,
    onDeleteCategory,
    onOpenNewCategory,
  } = props

  const [selectedCat, setSelectedCat] = useState<string>(categories[0] || 'FINANCIAL')
  const [activeTab, setActiveTab] = useState<'rules' | 'keywords' | 'custom'>('rules')
  const [addRuleOpen, setAddRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CustomRule | undefined>(undefined)
  const [kwDraft, setKwDraft] = useState('')
  const [allowDraft, setAllowDraft] = useState('')

  const activeCategoryName = categories.includes(selectedCat) ? selectedCat : categories[0]
  const cfg = configCategories[activeCategoryName]

  const meta = CATEGORY_META[activeCategoryName] ?? {
    icon: '📁',
    title: activeCategoryName,
    desc: 'Custom detection rules for organization data protection',
  }

  const builtinRules = BUILTIN_RULES_BY_CATEGORY[activeCategoryName] ?? []
  const customRules = cfg?.customRules ?? []
  const keywords = cfg?.customKeywords ?? []
  const allowlist = cfg?.allowlist ?? []
  const ac = cfg ? ACTION_COLORS[cfg.action] : ACTION_COLORS.BLOCK

  const totalBuiltin = builtinRules.length
  const disabledBuiltinCount = builtinRules.filter(
    (r) => cfg?.ruleOverrides?.[r.id]?.enabled === false
  ).length
  const activeBuiltinCount = totalBuiltin - disabledBuiltinCount
  const totalActiveFields = activeBuiltinCount + customRules.filter((r) => r.enabled !== false).length

  return (
    <>
      <div
        className="rounded-md border overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* ── Left Pane: Category Master List (4 cols) ── */}
        <div
          className="lg:col-span-4 border-b lg:border-b-0 lg:border-r p-3 sm:p-4 space-y-2 flex flex-col justify-between"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-surface-2)',
          }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Categories ({categories.length})
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenNewCategory}
                  disabled={!isOrgVerified}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus size={13} />
                  <span>New</span>
                </button>
              )}
            </div>

            {categories.map((cat) => {
              const cConfig = configCategories[cat]
              if (!cConfig) return null
              const isSelected = cat === activeCategoryName
              const cMeta = CATEGORY_META[cat] ?? { icon: <FolderIcon size={18} className="text-[var(--text-tertiary)]" />, title: cat, desc: '' }
              const cBuiltin = BUILTIN_RULES_BY_CATEGORY[cat] ?? []
              const cDisabled = cBuiltin.filter((r) => cConfig.ruleOverrides?.[r.id]?.enabled === false).length
              const cActiveCount = (cBuiltin.length - cDisabled) + (cConfig.customRules ?? []).filter(r => r.enabled !== false).length
              const cActionColors = ACTION_COLORS[cConfig.action]

              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`group relative flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'shadow-xs'
                      : 'hover:bg-[var(--bg-surface)]'
                  } ${cConfig.enabled ? 'opacity-100' : 'opacity-60'}`}
                  style={{
                    background: isSelected ? 'var(--bg-surface)' : 'transparent',
                    borderColor: isSelected ? 'var(--accent-border)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl size-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-surface-3)] border border-[var(--border)]">
                      {cMeta.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[var(--accent-text)]' : 'text-[var(--text-primary)]'}`}>
                          {cat}
                        </span>
                        {cConfig.enabled && (
                          <span
                            className="text-[9.5px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono"
                            style={{
                              background: cActionColors.bg,
                              borderColor: cActionColors.border,
                              color: cActionColors.text,
                            }}
                          >
                            {ACTION_LABEL[cConfig.action]}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-[var(--text-tertiary)] truncate">
                        {cConfig.enabled ? `${cActiveCount} active rules` : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Toggle
                      on={cConfig.enabled}
                      onChange={(en) => onToggleCategoryEnabled(cat, en)}
                      disabled={!isAdmin}
                    />
                    <ChevronRight
                      size={14}
                      className={`text-[var(--text-tertiary)] transition-transform ${
                        isSelected ? 'text-[var(--accent)] translate-x-0.5' : 'opacity-40'
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Left bottom helper note */}
          <div className="p-3 rounded-xl border bg-[var(--bg-surface)] text-[11px] text-[var(--text-tertiary)] space-y-1" style={{ borderColor: 'var(--border)' }}>
            <p className="font-semibold text-[var(--text-secondary)]">Category Tip</p>
            <p className="text-[10.5px] leading-relaxed">
              Select any category on the left to configure its enforcement action, detection patterns, and allowlists.
            </p>
          </div>
        </div>

        {/* ── Right Pane: Detailed Category Inspector (8 cols) ── */}
        <div className="lg:col-span-8 p-5 sm:p-6 flex flex-col justify-between space-y-6">
          {cfg ? (
            <div className="space-y-6">
              {/* Category Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl size-12 rounded-xl flex items-center justify-center shrink-0 bg-[var(--bg-surface-2)] border border-[var(--border)] shadow-xs">
                    {meta.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        {activeCategoryName}
                      </h3>
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs inline-flex items-center gap-1"
                        style={{
                          background: ac.bg,
                          borderColor: ac.border,
                          color: ac.text,
                        }}
                      >
                        {ACTION_ICONS[cfg.action]}
                        {ACTION_LABEL[cfg.action]}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)] tabular-nums">
                        {totalActiveFields} active rules
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {meta.desc}
                    </p>
                  </div>
                </div>

                {!isBuiltin(activeCategoryName) && isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteCategory(activeCategoryName)}
                    className="text-[var(--danger)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)] self-start sm:self-center"
                  >
                    <Trash2 size={13} className="mr-1.5" /> Delete Category
                  </Button>
                )}
              </div>

              {/* Action Picker Row */}
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                   style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Default Category Enforcement Action
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    How SecureGPT handles messages when this category is detected.
                  </p>
                </div>
                <ActionPicker
                  value={cfg.action}
                  onChange={(a) => onCategoryActionChange(activeCategoryName, a)}
                  disabled={!isAdmin || !cfg.enabled}
                />
              </div>

              {/* Inspector Subtabs */}
              <div className="space-y-4">
                <div
                  className="flex items-center gap-1 p-1 rounded-xl border"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab('rules')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'rules'
                        ? 'bg-[var(--bg-surface)] text-[var(--accent-text)] border border-[var(--border-2)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Shield size={13} />
                    <span>Detection Fields ({builtinRules.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('keywords')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'keywords'
                        ? 'bg-[var(--bg-surface)] text-[var(--accent-text)] border border-[var(--border-2)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Key size={13} />
                    <span>Keywords & Allowlist ({keywords.length + allowlist.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'custom'
                        ? 'bg-[var(--bg-surface)] text-[var(--accent-text)] border border-[var(--border-2)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>Custom Regex ({customRules.length})</span>
                  </button>
                </div>

                {/* Tab 1: Detection Fields */}
                {activeTab === 'rules' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-tertiary)] px-1">
                      <span>Pattern & Sensitivity</span>
                      <span>Action Override / State</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {builtinRules.map((rule) => {
                        const override = cfg.ruleOverrides?.[rule.id]
                        return (
                          <FieldRow
                            key={rule.id}
                            rule={rule}
                            override={override}
                            categoryAction={cfg.action}
                            onToggle={(enabled) =>
                              onRuleOverride(activeCategoryName, rule.id, {
                                ...override,
                                enabled,
                              })
                            }
                            onActionChange={(action) =>
                              onRuleOverride(activeCategoryName, rule.id, {
                                ...override,
                                action: action ?? undefined,
                              })
                            }
                            disabled={!isAdmin || !cfg.enabled}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Keywords & Allowlist */}
                {activeTab === 'keywords' && (
                  <div
                    className="p-4 rounded-xl border space-y-4"
                    style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                  >
                    <ChipInput
                      label="Explicit Target Keywords"
                      hint="Trigger immediate DLP response when any of these terms appear in prompts"
                      placeholder="e.g. ProjectTitan, Q3-Forecast, confidential-memo"
                      items={keywords}
                      draft={kwDraft}
                      setDraft={setKwDraft}
                      onAdd={(kw) => onAddKeyword(activeCategoryName, kw)}
                      onRemove={(kw) => onRemoveKeyword(activeCategoryName, kw)}
                      readOnly={!isAdmin || !cfg.enabled}
                    />

                    <div className="border-t pt-3.5" style={{ borderColor: 'var(--border)' }}>
                      <ChipInput
                        label="Trusted Safe Patterns (Allowlist)"
                        hint="Matches bypassed without warning (e.g. test card numbers, public dummy emails)"
                        placeholder="e.g. 4111-1111-1111-1111, test@corp.example.com"
                        items={allowlist}
                        draft={allowDraft}
                        setDraft={setAllowDraft}
                        onAdd={(p) => onAddAllowlist(activeCategoryName, p)}
                        onRemove={(p) => onRemoveAllowlist(activeCategoryName, p)}
                        readOnly={!isAdmin || !cfg.enabled}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Custom Regex Rules */}
                {activeTab === 'custom' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[var(--text-secondary)]">
                        Tailored Regex Detection Patterns
                      </p>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!cfg.enabled}
                          onClick={() => {
                            setEditingRule(undefined)
                            setAddRuleOpen(true)
                          }}
                          className="text-xs"
                        >
                          <Plus size={12} className="mr-1" /> Add Rule
                        </Button>
                      )}
                    </div>

                    {customRules.length === 0 ? (
                      <div
                        className="p-8 rounded-xl border text-center space-y-2"
                        style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                      >
                        <Sliders size={22} className="mx-auto text-[var(--text-tertiary)] opacity-60" />
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">
                          No custom rules defined in {activeCategoryName}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)] max-w-sm mx-auto">
                          Create specialized regular expressions for company-specific codes, employee IDs, or internal identifiers.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                        {customRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border transition-all"
                            style={{
                              background: 'var(--bg-surface-2)',
                              borderColor: 'var(--border)',
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[var(--text-primary)]">
                                  {rule.label}
                                </span>
                                <span
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                                  style={{
                                    background: 'var(--bg-surface)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {rule.pattern}
                                </span>
                              </div>
                              {rule.maskingLabel && (
                                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                                  Masked as: <code className="font-mono">{rule.maskingLabel}</code>
                                </p>
                              )}
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRule(rule)
                                    setAddRuleOpen(true)
                                  }}
                                  className="p-1.5 rounded-lg border text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
                                  style={{ borderColor: 'var(--border)' }}
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteCustomRule(activeCategoryName, rule.id)}
                                  className="p-1.5 rounded-lg border text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-all cursor-pointer"
                                  style={{ borderColor: 'var(--border)' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-xs text-[var(--text-tertiary)]">
              Select a category on the left to view its rules.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Custom Rule Modal */}
      <Modal open={addRuleOpen} onClose={() => { setAddRuleOpen(false); setEditingRule(undefined) }} size="sm">
        <AddEditRuleModal
          category={activeCategoryName}
          initialRule={editingRule}
          onSave={(ruleData) => {
            if (editingRule) {
              onUpdateCustomRule(activeCategoryName, editingRule.id, ruleData)
            } else {
              onAddCustomRule(activeCategoryName, ruleData)
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
