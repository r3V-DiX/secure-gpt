'use client'

import {
  Trash2,
  Shield,
  Key,
  Sparkles,
} from 'lucide-react'
import { ACTION_LABEL, ACTION_ICONS } from './ActionSelector'
import { Button } from '@/components/ui/button/button'
import { ActionPicker } from './ActionSelector'
import { ChipInput } from './KeywordsEditor'
import { FieldRow } from './PolicyManager'
import { CustomRulesTab } from './CustomRulesTab'
import type { CategoryConfig, CustomRule, RuleOverride, PolicyAction } from '@/types'

interface CategoryDetailPaneProps {
  cfg?: CategoryConfig
  meta: { icon: React.ReactNode; title: string; desc: string }
  activeCategoryName: string
  ac: { bg: string; border: string; text: string }
  totalActiveFields: number
  isBuiltin: (cat: string) => boolean
  isAdmin: boolean
  onDeleteCategory: (cat: string) => void
  onCategoryActionChange: (cat: string, action: PolicyAction) => void
  activeTab: 'rules' | 'keywords' | 'custom'
  setActiveTab: (tab: 'rules' | 'keywords' | 'custom') => void
  builtinRules: any[]
  onRuleOverride: (cat: string, ruleId: string, override: RuleOverride) => void
  keywords: string[]
  kwDraft: string
  setKwDraft: (val: string) => void
  onAddKeyword: (cat: string, kw: string) => void
  onRemoveKeyword: (cat: string, kw: string) => void
  allowlist: string[]
  allowDraft: string
  setAllowDraft: (val: string) => void
  onAddAllowlist: (cat: string, pattern: string) => void
  onRemoveAllowlist: (cat: string, pattern: string) => void
  customRules: CustomRule[]
  setEditingRule: (r?: CustomRule) => void
  setAddRuleOpen: (open: boolean) => void
  onDeleteCustomRule: (cat: string, ruleId: string) => void
}

export function CategoryDetailPane({
  cfg,
  meta,
  activeCategoryName,
  ac,
  totalActiveFields,
  isBuiltin,
  isAdmin,
  onDeleteCategory,
  onCategoryActionChange,
  activeTab,
  setActiveTab,
  builtinRules,
  onRuleOverride,
  keywords,
  kwDraft,
  setKwDraft,
  onAddKeyword,
  onRemoveKeyword,
  allowlist,
  allowDraft,
  setAllowDraft,
  onAddAllowlist,
  onRemoveAllowlist,
  customRules,
  setEditingRule,
  setAddRuleOpen,
  onDeleteCustomRule,
}: CategoryDetailPaneProps) {
  if (!cfg) {
    return (
      <div className="lg:col-span-8 p-5 sm:p-6 text-center py-20 text-xs text-[var(--text-tertiary)]">
        Select a category on the left to view its rules.
      </div>
    )
  }

  return (
    <div className="lg:col-span-8 p-5 sm:p-6 flex flex-col justify-between space-y-6">
      <div className="space-y-6">
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

          {activeTab === 'custom' && (
            <CustomRulesTab
              activeCategoryName={activeCategoryName}
              customRules={customRules}
              isAdmin={isAdmin}
              enabled={Boolean(cfg.enabled)}
              setEditingRule={setEditingRule}
              setAddRuleOpen={setAddRuleOpen}
              onDeleteCustomRule={onDeleteCustomRule}
            />
          )}
        </div>
      </div>
    </div>
  )
}
