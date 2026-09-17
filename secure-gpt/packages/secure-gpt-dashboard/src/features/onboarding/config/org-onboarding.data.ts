import { Building2, Globe2, ShieldCheck, UserPlus, ShieldAlert, Sparkles, Eye } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface OnboardingStep {
  id: 'profile' | 'domain' | 'policy' | 'invites'
  stepNumber: number
  title: string
  subtitle: string
  icon: LucideIcon
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    stepNumber: 1,
    title: 'Organization Details',
    subtitle: 'Define your enterprise profile & primary domain',
    icon: Building2,
  },
  {
    id: 'domain',
    stepNumber: 2,
    title: 'Domain Verification',
    subtitle: 'Verify ownership via DNS TXT challenge',
    icon: Globe2,
  },
  {
    id: 'policy',
    stepNumber: 3,
    title: 'Policy Preset',
    subtitle: 'Choose your default enterprise DLP baseline',
    icon: ShieldCheck,
  },
  {
    id: 'invites',
    stepNumber: 4,
    title: 'Team & Deployment',
    subtitle: 'Invite team members and deploy extension',
    icon: UserPlus,
  },
]

export type PolicyPresetKey = 'strict' | 'balanced' | 'permissive'

export interface PolicyPreset {
  id: PolicyPresetKey
  name: string
  badge: string
  badgeVariant: 'red' | 'blue' | 'emerald'
  icon: LucideIcon
  description: string
  highlights: string[]
  recommended?: boolean
  rulesConfig: {
    piiAction: 'BLOCK' | 'MASK' | 'AUDIT'
    financialAction: 'BLOCK' | 'MASK' | 'AUDIT'
    secretsAction: 'BLOCK' | 'MASK' | 'AUDIT'
    fileScanning: boolean
    blockUnapprovedAIs: boolean
  }
}

export const POLICY_PRESETS: Record<PolicyPresetKey, PolicyPreset> = {
  strict: {
    id: 'strict',
    name: 'Strict (Zero-Trust)',
    badge: 'Maximum Security',
    badgeVariant: 'red',
    icon: ShieldAlert,
    description: 'Strictly blocks prompts containing sensitive secrets, API keys, and unapproved AI platforms. Recommended for finance and healthcare.',
    highlights: [
      'Hard block on API keys, passwords, and private keys',
      'Mask all PII & financial information before submission',
      'Attachment & file drag-and-drop deep inspection',
      'Enforce corporate compliance across all browsers',
    ],
    rulesConfig: {
      piiAction: 'BLOCK',
      financialAction: 'BLOCK',
      secretsAction: 'BLOCK',
      fileScanning: true,
      blockUnapprovedAIs: true,
    },
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    badge: 'Recommended',
    badgeVariant: 'blue',
    icon: Sparkles,
    recommended: true,
    description: 'Masks sensitive PII and blocks critical credentials while maintaining a frictionless developer & productivity experience.',
    highlights: [
      'Auto-mask emails, phone numbers, and SSNs with synthetic placeholders',
      'Hard block high-risk credentials and private tokens',
      'Transparent user notification toast on redaction',
      'Supports all major AI assistants (ChatGPT, Claude, Gemini, Copilot)',
    ],
    rulesConfig: {
      piiAction: 'MASK',
      financialAction: 'MASK',
      secretsAction: 'BLOCK',
      fileScanning: true,
      blockUnapprovedAIs: false,
    },
  },
  permissive: {
    id: 'permissive',
    name: 'Permissive (Audit-Only)',
    badge: 'Observation',
    badgeVariant: 'emerald',
    icon: Eye,
    description: 'Silently logs and monitors data patterns without blocking employee workflows. Perfect for initial rollout discovery.',
    highlights: [
      'Zero interruption or latency for end users',
      'Full telemetry on shadow AI usage and leaked patterns',
      'Identifies top sensitive data risk categories',
      'One-click elevation to Balanced or Strict anytime',
    ],
    rulesConfig: {
      piiAction: 'AUDIT',
      financialAction: 'AUDIT',
      secretsAction: 'AUDIT',
      fileScanning: true,
      blockUnapprovedAIs: false,
    },
  },
}
