'use client'
// features/policy/components/ActionSelector.tsx
import { RadioGroup } from '@/components/ui'
import type { PolicyAction } from '@/types'
import { ShieldBan, EyeOff, AlertTriangle, ShieldCheck } from 'lucide-react'

export const ACTIONS: PolicyAction[] = ['BLOCK', 'MASK', 'WARN_ALLOW', 'ALLOW']

export const ACTION_LABEL: Record<PolicyAction, string> = {
  BLOCK: 'Block',
  MASK: 'Mask',
  WARN_ALLOW: 'Warn',
  ALLOW: 'Allow',
}

export const ACTION_ICONS: Record<PolicyAction, React.ReactNode> = {
  BLOCK: <ShieldBan size={12} className="shrink-0" />,
  MASK: <EyeOff size={12} className="shrink-0" />,
  WARN_ALLOW: <AlertTriangle size={12} className="shrink-0" />,
  ALLOW: <ShieldCheck size={12} className="shrink-0" />,
}

export const ACTION_COLORS: Record<PolicyAction, { bg: string; border: string; text: string; lightBg: string }> = {
  BLOCK:      { bg: 'var(--danger-light)',  border: 'var(--danger-border)',  text: 'var(--danger)', lightBg: 'rgba(220, 38, 38, 0.12)' },
  MASK:       { bg: 'var(--warning-light)', border: 'var(--warning-border)', text: 'var(--warning)', lightBg: 'rgba(217, 119, 6, 0.12)' },
  WARN_ALLOW: { bg: 'var(--info-light)',    border: 'var(--info-border)',    text: 'var(--info)', lightBg: 'rgba(2, 132, 199, 0.12)' },
  ALLOW:      { bg: 'var(--success-light)', border: 'var(--success-border)', text: 'var(--success)', lightBg: 'rgba(5, 150, 105, 0.12)' },
}

export function ActionPicker({
  value,
  onChange,
  disabled,
}: {
  value: PolicyAction
  onChange: (a: PolicyAction) => void
  disabled?: boolean
}) {
  return <RadioGroup label="Policy action" value={value} onValueChange={onChange} disabled={disabled}
    options={ACTIONS.map(action => ({ value: action, label: ACTION_LABEL[action], icon: ACTION_ICONS[action] }))} />
}
