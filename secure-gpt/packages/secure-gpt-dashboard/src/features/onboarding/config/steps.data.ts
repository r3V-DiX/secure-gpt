import {
  Download,
  MousePointerClick,
  Zap,
  SlidersHorizontal,
  Activity,
  Building2,
  Users,
  Shield,
  Database,
  FileCheck2,
  LucideIcon
} from 'lucide-react'
import type { AuthUser } from '@/types'

export const STORAGE_KEY = 'securegpt:get-started:done'
const SUPPORTED_PLATFORMS = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity', 'Meta AI']

export interface Step {
  id: string
  icon: LucideIcon
  title: string
  description: string
  autoDetectable?: boolean
}

export type ChecklistRole = 'super_admin' | 'org_admin' | 'employee' | 'personal_user'

export function resolveChecklistRole(user: AuthUser | null, isAdminMode: boolean): ChecklistRole {
  if (!user) return 'personal_user'
  if (user.role === 'super_admin' || user.role === 'platform_super_admin' || isAdminMode) {
    return 'super_admin'
  }
  if (user.role === 'org_admin' || user.role === 'security_admin' || (user.orgId && user.role === 'admin')) {
    return 'org_admin'
  }
  if (user.role === 'employee' || Boolean(user.orgId)) {
    return 'employee'
  }
  return 'personal_user'
}

// ── 1. SUPER ADMIN CHECKLIST ────────────────────────────────────────────────
export const SUPER_ADMIN_STEPS: Step[] = [
  {
    id: 'review_tenants',
    icon: Building2,
    title: 'Review Organization Tenants',
    description: 'Inspect active and pending company workspaces, verify DNS ownership, or perform manual verification overrides.',
  },
  {
    id: 'manage_roles',
    icon: Shield,
    title: 'Audit Global Roles & Permissions',
    description: 'Review system-defined role matrices (Super Admin, Security Admin, Auditor) and fine-tune operational access rules.',
  },
  {
    id: 'configure_master_policy',
    icon: SlidersHorizontal,
    title: 'Review System Master Policies',
    description: 'Inspect global DLP rules, standard regex engines, and cross-organization baseline configurations.',
  },
  {
    id: 'inspect_audit_stream',
    icon: Database,
    title: 'Verify System & Audit Telemetry Stream',
    description: 'Ensure cross-tenant administrative audit logs and real-time intercept events are being properly indexed.',
  },
]

// ── 2. EMPLOYER / ORG ADMIN CHECKLIST ───────────────────────────────────────
export const ORG_ADMIN_STEPS: Step[] = [
  {
    id: 'verify_domain',
    icon: Building2,
    title: 'Verify Corporate Domain (DNS TXT)',
    description: 'Add the challenge TXT record to your DNS provider to activate domain-level protection and unlock employee invitations.',
    autoDetectable: true,
  },
  {
    id: 'invite_team',
    icon: Users,
    title: 'Invite Team & Assign Departments',
    description: 'Generate cryptographic invite links or organize employees by department (Engineering, Finance, Support).',
  },
  {
    id: 'policy',
    icon: SlidersHorizontal,
    title: 'Configure Enterprise DLP Policies',
    description: 'Establish organization-wide thresholds for PII, Financial data, API keys, and toggle Document & File Scanning.',
  },
  {
    id: 'install',
    icon: Download,
    title: 'Deploy Browser Extension',
    description: 'Install or push the Chrome Extension to team workstations via Google Workspace or Chrome Enterprise MDM.',
    autoDetectable: true,
  },
  {
    id: 'track',
    icon: Activity,
    title: 'Monitor Audit Logs & Incidents',
    description: 'Review blocked prompts, audit logs, and risk rankings across all company departments.',
  },
]

// ── 3. EMPLOYEE CHECKLIST ───────────────────────────────────────────────────
export const EMPLOYEE_STEPS: Step[] = [
  {
    id: 'install',
    icon: Download,
    title: 'Install the SecureGPT Extension',
    description: 'Install the extension from the Chrome Web Store and pin it to your browser toolbar for always-on enterprise protection.',
    autoDetectable: true,
  },
  {
    id: 'connect',
    icon: MousePointerClick,
    title: 'Connect Your Company Account',
    description: 'Sign into the extension using your corporate email address to automatically inherit company data protection policies.',
    autoDetectable: true,
  },
  {
    id: 'verify',
    icon: Zap,
    title: 'Test Prompt Protection',
    description: `Open ${SUPPORTED_PLATFORMS.slice(0, 3).join(', ')} and type a test prompt. Verify that sensitive business data is masked before sending.`,
  },
  {
    id: 'review_policy_guidelines',
    icon: FileCheck2,
    title: 'Review Organization Policy Guidelines',
    description: 'Check active data handling rules and learn which sensitive identifiers (customer data, secrets) are protected by your company.',
  },
]

// ── 4. PERSONAL USER CHECKLIST ──────────────────────────────────────────────
export const PERSONAL_USER_STEPS: Step[] = [
  {
    id: 'install',
    icon: Download,
    title: 'Install the Chrome extension',
    description: 'SecureGPT runs entirely inside your browser. Install it from the Chrome Web Store, then pin it to your toolbar.',
    autoDetectable: true,
  },
  {
    id: 'connect',
    icon: MousePointerClick,
    title: 'Connect your account',
    description: 'Click the SecureGPT icon in your toolbar and sign in with Google or Email OTP to link your account.',
    autoDetectable: true,
  },
  {
    id: 'verify',
    icon: Zap,
    title: 'Verify it works',
    description: `Open ${SUPPORTED_PLATFORMS.slice(0, 4).join(', ')} and type a prompt containing sensitive test data to watch it get masked locally in real time.`,
  },
  {
    id: 'policy',
    icon: SlidersHorizontal,
    title: 'Review your privacy policy',
    description: 'Tune built-in sensitivity categories (PII, Financial, Secrets) or add your own custom regex patterns.',
  },
  {
    id: 'track',
    icon: Activity,
    title: 'Track activity & devices',
    description: 'Every detection shows up in your private Event Log. Track connected devices and export logs with zero raw data sent to cloud servers.',
  },
]

export function getChecklistForRole(role: ChecklistRole): {
  title: string
  subtitle: string
  steps: Step[]
} {
  switch (role) {
    case 'super_admin':
      return {
        title: 'Platform Administration Setup',
        subtitle: 'Configure global tenant management, audit platform-wide roles, and verify infrastructure telemetry.',
        steps: SUPER_ADMIN_STEPS,
      }
    case 'org_admin':
      return {
        title: 'Organization Setup & Deployment',
        subtitle: 'Complete enterprise domain verification, deploy DLP protection to workstations, and configure company policies.',
        steps: ORG_ADMIN_STEPS,
      }
    case 'employee':
      return {
        title: 'Employee Workspace Onboarding',
        subtitle: 'Set up your browser extension, connect your corporate account, and verify active AI prompt protection.',
        steps: EMPLOYEE_STEPS,
      }
    case 'personal_user':
    default:
      return {
        title: 'Personal Privacy Setup',
        subtitle: 'Set up SecureGPT in a few minutes — install, connect, and start protecting your personal AI chats with 100% local masking.',
        steps: PERSONAL_USER_STEPS,
      }
  }
}
