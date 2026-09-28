import React from 'react'
import {
  LayoutDashboard, FileText, ShieldCheck,
  User, Settings, Users, Sparkles, ShieldAlert,
  Shield, Key, ClipboardList, Database, Building2
} from 'lucide-react'

export interface NavItemConfig {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  exact?: boolean
  adminOnly?: boolean
  superAdminOnly?: boolean
  badge?: string
}

export interface NavGroup {
  label: string
  items: NavItemConfig[]
}

export const STANDARD_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Get Started', href: '/get-started', icon: Sparkles, badge: 'Setup' },
    ],
  },
  {
    label: 'Security & Telemetry',
    items: [
      { label: 'Incidents Stream', href: '/incidents', icon: ShieldAlert },
      { label: 'Event Log', href: '/event-logs', icon: FileText },
    ],
  },
  {
    label: 'Governance & Admin',
    items: [
      { label: 'Policy Rules', href: '/policy', icon: ShieldCheck },
      { label: 'Team & Org', href: '/team', icon: Users, adminOnly: true },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/profile', icon: User },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export const SUPER_ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Security & Logs',
    items: [
      { label: 'Event Logs', href: '/event-logs', icon: FileText },
      { label: 'Audit Logs', href: '/audit', icon: ClipboardList, superAdminOnly: true },
      { label: 'System Logs', href: '/system-logs', icon: Database, superAdminOnly: true },
    ],
  },
  {
    label: 'Access & Governance',
    items: [
      { label: 'Organizations', href: '/organizations', icon: Building2, superAdminOnly: true },
      { label: 'Policy Rules', href: '/policy', icon: ShieldCheck },
      { label: 'Global Users', href: '/users', icon: Users, superAdminOnly: true },
      { label: 'Roles', href: '/roles', icon: Shield, superAdminOnly: true },
      { label: 'Permissions', href: '/permissions', icon: Key, superAdminOnly: true },
    ],
  },
  {
    label: 'Account & System',
    items: [
      { label: 'Profile', href: '/profile', icon: User },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]
