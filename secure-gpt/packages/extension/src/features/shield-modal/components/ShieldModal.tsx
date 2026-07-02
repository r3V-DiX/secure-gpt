import { useEffect, useRef } from 'react'
import { previewMasking } from '@/features/actions/services/masking.service'
import { PII_CATEGORY_LABELS } from '@securegpt/shared/constants'
import type { DetectionResult, PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'
import { clsx } from 'clsx'

interface ShieldModalProps {
  result: DetectionResult
  config: PIIConfig
  originalText: string
  onProceed?: (acknowledged: boolean) => void
  onCancel: () => void
  onMask?: () => void
  readOnly?: boolean
  readOnlyTitle?: string
}

const categoryStyles: Record<PIICategory, { bg: string; border: string; text: string; dot: string }> = {
  FINANCIAL:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-400' },
  PII:         { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  CONFIDENTIAL:{ bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400' },
  IP:          { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-400' },
}

const categoryIcons: Record<PIICategory, string> = {
  FINANCIAL: '💳',
  PII: '👤',
  CONFIDENTIAL: '🔐',
  IP: '🌐',
}

function truncate(value: string): string {
  if (value.length <= 24) return value
  return `${value.slice(0, 10)}···${value.slice(-6)}`
}

export function ShieldModal({
  result,
  originalText,
  onProceed,
  onCancel,
  onMask,
  readOnly = false,
  readOnlyTitle,
}: ShieldModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const { diff } = previewMasking(originalText, result.entities)

  const grouped = result.entities.reduce<Partial<Record<PIICategory, PIIEntity[]>>>(
    (acc, entity) => {
      if (!acc[entity.category]) acc[entity.category] = []
      acc[entity.category]!.push(entity)
      return acc
    },
    {}
  )

  const totalItems = result.entities.length

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal wrapper */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shield-modal-title"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="modal-header">
            <div className="shield-icon-wrap">🛡️</div>
            <div className="flex-1 min-w-0">
              <h2 id="shield-modal-title" className="modal-title">
                {readOnlyTitle ?? 'Sensitive data detected'}
              </h2>
              <p className="modal-subtitle">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} found · {readOnly ? 'monitored by policy' : 'review before sending'}
              </p>
            </div>
            <button className="close-btn" onClick={onCancel} aria-label="Close">✕</button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="modal-body">

            {/* Detected items grouped by category */}
            {(Object.entries(grouped) as [PIICategory, PIIEntity[]][]).map(([cat, entities]) => {
              const s = categoryStyles[cat]
              return (
                <div key={cat} className={clsx('category-card', s.bg, s.border)}>
                  <div className="category-header">
                    <span className="category-icon">{categoryIcons[cat]}</span>
                    <span className={clsx('category-label', s.text)}>
                      {PII_CATEGORY_LABELS[cat]}
                    </span>
                    <span className={clsx('category-count', s.text)}>{entities.length}</span>
                  </div>
                  <div className="entity-list">
                    {entities.map((entity) => (
                      <div key={entity.id} className="entity-row">
                        <span className={clsx('entity-dot', s.dot)} />
                        <span className="entity-type">
                          {entity.type.replace(/_/g, ' ')}
                        </span>
                        <code className="entity-value">
                          {truncate(entity.value)}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Masking preview */}
            {diff.some(p => p.masked) && (
              <div className="preview-card">
                <p className="preview-label">Preview after masking</p>
                <div className="preview-text">
                  {diff.map((part, i) =>
                    part.masked ? (
                      <span key={i} className="masked-token">{part.text}</span>
                    ) : (
                      <span key={i}>{part.text}</span>
                    )
                  )}
                </div>
              </div>
            )}

          </div>

          {/* ── Footer ── */}
          <div className="modal-footer">
            {readOnly ? (
              <div className="footer-actions">
                <button className="btn-primary btn-full" onClick={onCancel}>
                  Close
                </button>
              </div>
            ) : (
              <div className="footer-actions">
                <button className="btn-secondary" onClick={onCancel}>Cancel</button>
                {onProceed && <button className="btn-ghost" onClick={() => onProceed(true)}>Send anyway</button>}
                {onMask && (
                  <button className="btn-primary btn-full" onClick={onMask}>
                    🔒 Mask &amp; Send
                  </button>
                )}
              </div>
            )}
            <p className="footer-note">This action will be logged by SecureGPT</p>
          </div>

        </div>
      </div>
    </>
  )
}
