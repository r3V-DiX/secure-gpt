'use client'

import React from 'react'
import { Plus, Sliders, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import type { CustomRule } from '@/types'

interface CustomRulesTabProps {
  activeCategoryName: string
  customRules: CustomRule[]
  isAdmin: boolean
  enabled: boolean
  setEditingRule: (r?: CustomRule) => void
  setAddRuleOpen: (open: boolean) => void
  onDeleteCustomRule: (cat: string, ruleId: string) => void
}

export function CustomRulesTab({
  activeCategoryName,
  customRules,
  isAdmin,
  enabled,
  setEditingRule,
  setAddRuleOpen,
  onDeleteCustomRule,
}: CustomRulesTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--text-secondary)]">
          Tailored Regex Detection Patterns
        </p>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            disabled={!enabled}
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
  )
}
