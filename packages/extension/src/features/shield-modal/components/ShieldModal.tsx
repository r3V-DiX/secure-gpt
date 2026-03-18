// ─────────────────────────────────────────────
// Shield Modal
// Shown when WARN_ALLOW action is triggered
// User reviews detected entities and decides
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button/button'
import { Badge } from '@/components/ui/badge/badge'
import { previewMasking } from '@/features/actions/services/masking.service'
import {
  PII_CATEGORY_LABELS,
  POLICY_ACTION_LABELS,
} from '@securegpt/shared/constants'
import type { DetectionResult, PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'
import { clsx } from 'clsx'

interface ShieldModalProps {
  result: DetectionResult
  config: PIIConfig
  originalText: string
  onProceed: (acknowledged: boolean) => void
  onCancel: () => void
  onMask: () => void
}

const severityColors = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'info',
} as const

const categoryColors: Record<PIICategory, string> = {
  FINANCIAL: 'bg-red-50 border-red-200 text-red-700',
  PII: 'bg-amber-50 border-amber-200 text-amber-700',
  CONFIDENTIAL: 'bg-purple-50 border-purple-200 text-purple-700',
  IP: 'bg-blue-50 border-blue-200 text-blue-700',
}

export function ShieldModal({
  result,
  config,
  originalText,
  onProceed,
  onCancel,
  onMask,
}: ShieldModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Trap focus inside modal
  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const { diff } = previewMasking(originalText, result.entities)

  // Group entities by category
  const grouped = result.entities.reduce<Partial<Record<PIICategory, PIIEntity[]>>>(
    (acc, entity) => {
      const cat = entity.category
      if (!acc[cat]) acc[cat] = []
      acc[cat]!.push(entity)
      return acc
    },
    {}
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shield-modal-title"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up"
          style={{ fontFamily: 'var(--sg-font)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 text-lg">⚠️</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="shield-modal-title" className="font-semibold text-gray-900 text-sm">
                Sensitive data detected
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {result.entities.length} item{result.entities.length !== 1 ? 's' : ''} found
                {' · '}detected by {result.tier.toUpperCase()} tier
              </p>
            </div>
            <button
              onClick={onCancel}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Detected entities grouped by category */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Detected items
              </p>
              {(Object.entries(grouped) as [PIICategory, PIIEntity[]][]).map(([cat, entities]) => (
                <div key={cat} className={clsx('rounded-xl border p-3', categoryColors[cat])}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold">{PII_CATEGORY_LABELS[cat]}</span>
                    <Badge variant="neutral" className="text-xs">{entities.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {entities.map((entity) => (
                      <div key={entity.id} className="flex items-center justify-between gap-3 bg-white/60 rounded-lg px-3 py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-gray-500 flex-shrink-0">{entity.type.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-mono text-gray-700 truncate bg-gray-100 px-2 py-0.5 rounded">
                            {entity.value.length > 30
                              ? `${entity.value.slice(0, 15)}...${entity.value.slice(-8)}`
                              : entity.value}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant={severityColors[entity.severity]}>
                            {entity.severity}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {Math.round(entity.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview masked text */}
            {diff.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Preview after masking
                </p>
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 leading-relaxed font-mono border border-gray-200 max-h-28 overflow-y-auto">
                  {diff.map((part, i) =>
                    part.masked ? (
                      <span
                        key={i}
                        className="bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-semibold"
                      >
                        {part.text}
                      </span>
                    ) : (
                      <span key={i}>{part.text}</span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Policy notice */}
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 border border-blue-100">
              <strong>Company policy applies.</strong> This event will be logged regardless of your choice.
            </div>
          </div>

          {/* Action footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={onCancel}
                className="flex-shrink-0"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onMask}
                className="flex-shrink-0"
              >
                🎭 Mask & Send
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => onProceed(true)}
                className="text-gray-600 justify-center"
              >
                Acknowledge & Send anyway
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Pressing "Mask & Send" is the recommended action
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
