// ─────────────────────────────────────────────
// Standard Policy Actions & Severities
// ─────────────────────────────────────────────

export const POLICY_ACTIONS = {
  BLOCK: 'BLOCK',
  MASK: 'MASK',
  WARN_ALLOW: 'WARN_ALLOW',
  ALLOW: 'ALLOW',
} as const

export type PolicyAction = keyof typeof POLICY_ACTIONS

export const POLICY_ACTION_LABELS: Record<PolicyAction, string> = {
  BLOCK: 'Block',
  MASK: 'Mask',
  WARN_ALLOW: 'Warn',
  ALLOW: 'Allow',
}

export const POLICY_ACTION_DESCRIPTIONS: Record<PolicyAction, string> = {
  BLOCK: 'Submission is completely prevented. User cannot proceed.',
  MASK: 'Sensitive tokens replaced with placeholders before sending.',
  WARN_ALLOW: 'User is warned but can acknowledge and proceed.',
  ALLOW: 'Content passes through. Logged silently for audit.',
}

export const SEVERITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export type SeverityLevel = keyof typeof SEVERITY_LEVELS

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}
