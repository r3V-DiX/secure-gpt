// ─────────────────────────────────────────────
// Keywords Section
// Manage custom keywords per category
// ─────────────────────────────────────────────

import React, { useState } from 'react'
import { Card } from '@/components/ui/card/card'
import { Button } from '@/components/ui/button/button'
import { PII_CATEGORIES, PII_CATEGORY_LABELS } from '@securegpt/shared/constants'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'

interface KeywordsSectionProps {
  config: PIIConfig
  onAdd: (category: PIICategory, keyword: string) => void
  onRemove: (category: PIICategory, keyword: string) => void
}

export function KeywordsSection({ config, onAdd, onRemove }: KeywordsSectionProps) {
  const [inputs, setInputs] = useState<Partial<Record<PIICategory, string>>>({})

  function handleAdd(category: PIICategory) {
    const kw = inputs[category]?.trim()
    if (!kw) return
    onAdd(category, kw)
    setInputs((prev) => ({ ...prev, [category]: '' }))
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Custom Keywords</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Add organisation-specific terms to detect. SecureGPT will flag any text containing these keywords.
        </p>
      </div>

      {(Object.keys(PII_CATEGORIES) as PIICategory[]).map((category) => {
        const keywords = config.categories[category]?.customKeywords ?? []
        const isEnabled = config.categories[category]?.enabled ?? true

        return (
          <Card key={category} padding="md" className={!isEnabled ? 'opacity-60' : ''}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {PII_CATEGORY_LABELS[category]}
            </h3>

            {/* Add keyword input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={inputs[category] ?? ''}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, [category]: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleAdd(category)}
                placeholder="Type a keyword and press Enter"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isEnabled}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAdd(category)}
                disabled={!isEnabled || !inputs[category]?.trim()}
              >
                Add
              </Button>
            </div>

            {/* Keyword chips */}
            {keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full"
                  >
                    {kw}
                    <button
                      onClick={() => onRemove(category, kw)}
                      className="hover:text-blue-900 font-medium leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No custom keywords added for this category.</p>
            )}
          </Card>
        )
      })}
    </div>
  )
}
