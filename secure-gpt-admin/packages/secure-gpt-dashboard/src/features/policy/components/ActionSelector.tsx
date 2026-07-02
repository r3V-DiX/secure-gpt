'use client'
// features/policy/components/ActionSelector.tsx
// Shared constants only — the actual selector UI lives in CategoryCard.
import type { PolicyAction } from '@/types'

export const ACTIONS: PolicyAction[] = ['BLOCK', 'MASK', 'WARN_ALLOW', 'ALLOW']

export const ACTION_LABEL: Record<PolicyAction, string> = {
  BLOCK: 'Block',
  MASK: 'Mask',
  WARN_ALLOW: 'Warn',
  ALLOW: 'Allow',
}

export const ACTION_COLORS: Record<PolicyAction, { bg: string; border: string; text: string }> = {
  BLOCK:      { bg: 'var(--danger-light)',  border: 'var(--danger-border)',  text: 'var(--danger)' },
  MASK:       { bg: 'var(--warning-light)', border: 'var(--warning-border)', text: 'var(--warning)' },
  WARN_ALLOW: { bg: 'var(--info-light)',    border: 'var(--info-border)',    text: 'var(--info)' },
  ALLOW:      { bg: 'var(--success-light)', border: 'var(--success-border)', text: 'var(--success)' },
}
