// ─────────────────────────────────────────────
// Categories Section
// Toggle each PII category on/off
// ─────────────────────────────────────────────

import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card/card'
import { Toggle } from '@/components/ui/toggle/toggle'
import { Badge } from '@/components/ui/badge/badge'
import {
  PII_CATEGORIES,
  PII_CATEGORY_LABELS,
  PII_CATEGORY_DESCRIPTIONS,
  PII_CATEGORY_EXAMPLES,
} from '@securegpt/shared/constants'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'

interface CategoriesSectionProps {
  config: PIIConfig
  onToggle: (category: PIICategory, enabled: boolean) => void
}

const categoryIcons: Record<PIICategory, string> = {
  FINANCIAL: '💳',
  PII: '👤',
  CONFIDENTIAL: '🔐',
  IP: '💡',
}

export function CategoriesSection({ config, onToggle }: CategoriesSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Data Categories</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose which types of sensitive data SecureGPT should detect and protect.
        </p>
      </div>

      {(Object.keys(PII_CATEGORIES) as PIICategory[]).map((category) => {
        const categoryConfig = config.categories[category]
        const isEnabled = categoryConfig?.enabled ?? true

        return (
          <Card key={category} padding="md" className={!isEnabled ? 'opacity-70' : ''}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0 mt-0.5">{categoryIcons[category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {PII_CATEGORY_LABELS[category]}
                    </h3>
                    {isEnabled ? (
                      <Badge variant="success" dot>Active</Badge>
                    ) : (
                      <Badge variant="neutral">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {PII_CATEGORY_DESCRIPTIONS[category]}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {PII_CATEGORY_EXAMPLES[category].map((ex) => (
                      <span
                        key={ex}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Toggle
                checked={isEnabled}
                onChange={(val) => onToggle(category, val)}
                size="md"
              />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
