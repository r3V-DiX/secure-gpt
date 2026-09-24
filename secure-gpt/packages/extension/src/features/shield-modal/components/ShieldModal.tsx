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
  readOnlyTitle?: string | undefined
}

const categoryStyles: Record<PIICategory, { bg: string; border: string; text: string; dot: string }> = {
  FINANCIAL:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-400' },
  PII:         { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  CONFIDENTIAL:{ bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400' },
  IP:          { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-400' },
}

const categoryIcons: Record<PIICategory, React.ReactNode> = {
  FINANCIAL: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  PII: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  CONFIDENTIAL: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  IP: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  ),
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

    // Find all focusable elements within the modal
    const getFocusable = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )

    const focusable = getFocusable()
    if (focusable.length > 0 && focusable[0]) {
      focusable[0].focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCancel()
        return
      }

      if (e.key === 'Tab') {
        const currentFocusable = getFocusable()
        if (currentFocusable.length === 0) return

        const firstElement = currentFocusable[0]
        const lastElement = currentFocusable[currentFocusable.length - 1]

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || !el.contains(document.activeElement)) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement || !el.contains(document.activeElement)) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
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
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-slide-up"
      >
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="modal-header">
            <div className="shield-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="shield-modal-title" className="modal-title">
                {readOnlyTitle ?? 'Sensitive data detected'}
              </h2>
              <p className="modal-subtitle">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} found · {readOnly ? 'monitored by policy' : 'review before sending'}
              </p>
            </div>
            <button className="close-btn" onClick={onCancel} aria-label="Close modal">✕</button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="modal-body">

            {/* Detected items grouped by category */}
            {(Object.entries(grouped) as [PIICategory, PIIEntity[]][]).map(([cat, entities]) => {
              const s = categoryStyles[cat] ?? { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' }
              return (
                <div key={cat} className={clsx('category-card', s.bg, s.border)}>
                  <div className="category-header">
                    <span className="category-icon">{categoryIcons[cat] ?? '⚠️'}</span>
                    <span className={clsx('category-label', s.text)}>
                      {PII_CATEGORY_LABELS[cat] ?? cat}
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
                  <button className="btn-primary btn-full flex items-center justify-center gap-1.5" onClick={onMask}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Mask &amp; Send</span>
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
