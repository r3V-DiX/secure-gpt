import { Step } from 'react-joyride'
import type { AuthUser } from '@/types'

export type TourRole = 'super_admin' | 'org_admin' | 'employee' | 'personal_user'

export function resolveTourRole(user: AuthUser | null, isAdminMode: boolean): TourRole {
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

export const SUPER_ADMIN_TOUR_STEPS: Step[] = [
  {
    target: '#tour-dashboard',
    content: 'Global Command Center: Monitor system health, global telemetry, and cross-tenant compliance metrics in real time.',
    placement: 'right',
  },
  {
    target: '#tour-organizations',
    content: 'Tenant Governance: Manage registered organizations, perform manual DNS TXT verification overrides, and oversee tenant health.',
    placement: 'right',
  },
  {
    target: '#tour-users',
    content: 'Global RBAC & Accounts: Audit user accounts across all tenants and assign platform roles (Super Admin, Security Admin, Auditor).',
    placement: 'right',
  },
  {
    target: '#tour-roles',
    content: 'Role & Permission Engine: Configure modular permission matrices and granular action privileges.',
    placement: 'right',
  },
  {
    target: '#tour-system-logs',
    content: 'Audit & System Stream: Inspect platform-wide audit trails, intercept forensics, and critical infrastructure logs.',
    placement: 'right',
  },
]

export const ORG_ADMIN_TOUR_STEPS: Step[] = [
  {
    target: '#tour-get-started',
    content: 'Enterprise Setup Checklist: Track your live corporate domain verification, extension deployment, and team onboarding progress.',
    placement: 'right',
  },
  {
    target: '#tour-dashboard',
    content: 'Organization Dashboard: View live detection counts, top violating departments, and security posture across your enterprise.',
    placement: 'right',
  },
  {
    target: '#tour-team',
    content: 'Team & Department Directory: Invite employees with cryptographic join links, manage RBAC roles, and organize team departments.',
    placement: 'right',
  },
  {
    target: '#tour-policy',
    content: 'Enterprise Policy Workspace: Customize zero-trust thresholds for PII, Financial data, API keys, and enable Document & File scanning.',
    placement: 'right',
  },
  {
    target: '#tour-incidents',
    content: 'Incidents & Violations: Review real-time blocked prompt events, severity breakdown, and employee risk scores.',
    placement: 'right',
  },
]

export const EMPLOYEE_TOUR_STEPS: Step[] = [
  {
    target: '#tour-get-started',
    content: 'Quick Setup: Complete extension installation, pair your corporate account, and verify active prompt protection.',
    placement: 'right',
  },
  {
    target: '#tour-dashboard',
    content: 'Personal Protection Overview: Track your protected prompts, redaction stats, and active extension status.',
    placement: 'right',
  },
  {
    target: '#tour-policy',
    content: 'Company Policy Guidelines: Review your organization’s active data protection rules and compliance baseline.',
    placement: 'right',
  },
  {
    target: '#tour-event-logs',
    content: 'Activity History: Inspect your protected AI interactions and masked sensitive entities in real time.',
    placement: 'right',
  },
]

export const PERSONAL_USER_TOUR_STEPS: Step[] = [
  {
    target: '#tour-get-started',
    content: 'Start Here: Follow 5 simple steps to install the browser extension and activate privacy protection on ChatGPT, Claude, and Gemini.',
    placement: 'right',
  },
  {
    target: '#tour-dashboard',
    content: 'Personal Command Center: Monitor lifetime protected prompts, sensitive data redactions, and connected browsers.',
    placement: 'right',
  },
  {
    target: '#tour-policy',
    content: 'Custom Privacy Rules: Tune detection sensitivity thresholds or create custom regex filters for personal projects.',
    placement: 'right',
  },
  {
    target: '#tour-event-logs',
    content: 'Audit Logs: Review every masked PII item, API key, and document scan with zero raw data sent to cloud servers.',
    placement: 'right',
  },
]

export function getTourStepsForRole(role: TourRole): Step[] {
  switch (role) {
    case 'super_admin':
      return SUPER_ADMIN_TOUR_STEPS
    case 'org_admin':
      return ORG_ADMIN_TOUR_STEPS
    case 'employee':
      return EMPLOYEE_TOUR_STEPS
    case 'personal_user':
    default:
      return PERSONAL_USER_TOUR_STEPS
  }
}
