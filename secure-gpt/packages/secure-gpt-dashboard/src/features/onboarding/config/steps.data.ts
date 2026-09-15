import { Download, MousePointerClick, Zap, SlidersHorizontal, Activity, Building2, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const STORAGE_KEY = 'securegpt:get-started:done'
const SUPPORTED_PLATFORMS = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity', 'Meta AI']

export interface Step {
  id: string
  icon: LucideIcon
  title: string
  description: string
}

export const USER_STEPS: Step[] = [
  {
    id: 'install',
    icon: Download,
    title: 'Install the Chrome extension',
    description:
      'SecureGPT runs entirely inside your browser. Install it from the Chrome Web Store, then pin it to your toolbar so protection is always one click away.',
  },
  {
    id: 'connect',
    icon: MousePointerClick,
    title: 'Connect your account',
    description:
      'Click the SecureGPT icon in your toolbar and sign in with Google. It reuses the same secure session as this dashboard, so your extension and account are linked instantly.',
  },
  {
    id: 'verify',
    icon: Zap,
    title: 'Verify it works',
    description: `Open ${SUPPORTED_PLATFORMS.slice(0, 4).join(', ')} or another supported AI platform and type a prompt that contains sensitive data like an email, phone number, or API key. Watch it get masked or blocked in real time.`,
  },
  {
    id: 'policy',
    icon: SlidersHorizontal,
    title: 'Review your policy',
    description:
      'Policies decide what happens to sensitive data. Tune the built-in categories (PII, financial, confidential, IP) or add your own regex rules to match your team.',
  },
  {
    id: 'track',
    icon: Activity,
    title: 'Track activity & devices',
    description:
      'Every detection shows up in your Event Log. See which browsers are protected, export logs as CSV, and watch your dashboard stats grow as you work.',
  },
]

export const ORG_ADMIN_STEPS: Step[] = [
  {
    id: 'verify_domain',
    icon: Building2,
    title: 'Verify Corporate Domain (DNS TXT)',
    description:
      'Add the challenge TXT record to your DNS provider to activate domain-level protection and unlock employee invitations.',
  },
  {
    id: 'invite_team',
    icon: Users,
    title: 'Invite Team & Assign Departments',
    description:
      'Invite employees matching your corporate domain and segregate policies by Engineering, Finance, or General Org Baseline.',
  },
  {
    id: 'policy',
    icon: SlidersHorizontal,
    title: 'Configure Enterprise DLP Policy',
    description:
      'Establish organization-wide thresholds for PII, Financial data, API keys, and toggle Document & File Scanning.',
  },
  {
    id: 'install',
    icon: Download,
    title: 'Deploy Browser Extension',
    description:
      'Install or push the Chrome Extension to team workstations via Google Workspace or Chrome Enterprise MDM.',
  },
  {
    id: 'track',
    icon: Activity,
    title: 'Monitor Audit Logs & Incidents',
    description:
      'Review blocked prompts, audit logs, and trigger leaderboards across all company departments.',
  },
]
