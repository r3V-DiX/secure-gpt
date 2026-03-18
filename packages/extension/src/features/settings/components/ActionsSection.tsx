// ─────────────────────────────────────────────
// Actions Section
// Set enforcement action per category
// ─────────────────────────────────────────────

import React from 'react'
import { Card } from '@/components/ui/card/card'
import {
  PII_CATEGORIES,
  PII_CATEGORY_LABELS,
  POLICY_ACTIONS,
  POLICY_ACTION_LABELS,
  POLICY_ACTION_DESCRIPTIONS,
  POLICY_ACTION_COLORS,
} from '@securegpt/shared/constants'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'
import { clsx } from 'clsx'

interface ActionsSectionProps {
  config: PIIConfig
  onSetAction: (category: PIICategory, action: PolicyAction) => void
}

const actionStyles: Record<PolicyAction, string> = {
  BLOCK: 'border-red-200 bg-red-50 text-red-700 data-[selected=true]:border-red-500 data-[selected=true]:bg-red-100',
  MASK: 'border-amber-200 bg-amber-50 text-amber-700 data-[selected=true]:border-amber-500 data-[selected=true]:bg-amber-100',
  WARN_ALLOW: 'border-orange-200 bg-orange-50 text-orange-700 data-[selected=true]:border-orange-500 data-[selected=true]:bg-orange-100',
  ALLOW: 'border-blue-200 bg-blue-50 text-blue-700 data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-100',
}

const actionIcons: Record<PolicyAction, string> = {
  BLOCK: '🚫',
  MASK: '🎭',
  WARN_ALLOW: '⚠️',
  ALLOW: 'ℹ️',
}

export function ActionsSection({ config, onSetAction }: ActionsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Enforcement Actions</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose what happens when each type of sensitive data is detected.
        </p>
      </div>

      {(Object.keys(PII_CATEGORIES) as PIICategory[]).map((category) => {
        const categoryConfig = config.categories[category]
        const currentAction = categoryConfig?.action as PolicyAction ?? 'BLOCK'
        const isEnabled = categoryConfig?.enabled ?? true

        return (
          <Card key={category} padding="md" className={!isEnabled ? 'opacity-50 pointer-events-none' : ''}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              {PII_CATEGORY_LABELS[category]}
              {!isEnabled && (
                <span className="text-xs text-gray-400 font-normal">(disabled)</span>
              )}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(POLICY_ACTIONS) as PolicyAction[]).map((action) => {
                const isSelected = currentAction === action
                return (
                  <button
                    key={action}
                    data-selected={isSelected}
                    onClick={() => onSetAction(category, action)}
                    className={clsx(
                      'flex flex-col gap-1 p-3 rounded-lg border-2 text-left transition-all duration-100',
                      'hover:shadow-sm',
                      actionStyles[action],
                      isSelected ? 'ring-1 ring-offset-0' : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{actionIcons[action]}</span>
                      <span className="text-xs font-semibold">{POLICY_ACTION_LABELS[action]}</span>
                      {isSelected && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </div>
                    <p className="text-xs opacity-80 leading-snug">
                      {POLICY_ACTION_DESCRIPTIONS[action]}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
