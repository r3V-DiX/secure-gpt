'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { Toggle } from './PolicyManager'
import { ChevronRight } from 'lucide-react'
import { ACTION_LABEL, ACTION_COLORS } from './ActionSelector'
import type { CategoryConfig } from '@/types'
import { FolderIcon } from '@/components/icons'

interface CategoryNavListProps {
  categories: string[]
  configCategories: Record<string, CategoryConfig>
  activeCategoryName: string
  setSelectedCat: (cat: string) => void
  onToggleCategoryEnabled: (cat: string, enabled: boolean) => void
  isAdmin: boolean
  isOrgVerified: boolean
  onAddCategoryClick: () => void
  categoryMeta: Record<string, { icon: React.ReactNode; title: string; desc: string }>
  builtinRulesByCategory: Record<string, any[]>
}

export function CategoryNavList({
  categories,
  configCategories,
  activeCategoryName,
  setSelectedCat,
  onToggleCategoryEnabled,
  isAdmin,
  isOrgVerified,
  onAddCategoryClick,
  categoryMeta,
  builtinRulesByCategory,
}: CategoryNavListProps) {
  return (
    <div className="lg:col-span-4 p-4 border-b lg:border-b-0 lg:border-r flex flex-col justify-between space-y-4"
         style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between pb-2 mb-1 px-1 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Policy Categories ({categories.length})
          </span>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddCategoryClick}
              disabled={!isOrgVerified}
              className="text-xs h-7 px-2 text-[var(--accent-text)]"
            >
              <Plus size={13} className="mr-1" /> New
            </Button>
          )}
        </div>

        {categories.map((cat) => {
          const cConfig = configCategories[cat]
          if (!cConfig) return null
          const isSelected = cat === activeCategoryName
          const cMeta = categoryMeta[cat] ?? { icon: <FolderIcon size={18} className="text-[var(--text-tertiary)]" />, title: cat, desc: '' }
          const cBuiltin = builtinRulesByCategory[cat] ?? []
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

      <div className="p-3 rounded-xl border bg-[var(--bg-surface)] text-[11px] text-[var(--text-tertiary)] space-y-1" style={{ borderColor: 'var(--border)' }}>
        <p className="font-semibold text-[var(--text-secondary)]">Category Tip</p>
        <p className="text-[10.5px] leading-relaxed">
          Select any category on the left to configure its enforcement action, detection patterns, and allowlists.
        </p>
      </div>
    </div>
  )
}
