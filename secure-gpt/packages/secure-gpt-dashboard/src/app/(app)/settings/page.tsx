'use client'

import { useState, type ReactNode } from 'react'
import { ArrowUpRight, Database, Download, Info, Lock, LogOut, Monitor, ShieldCheck, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, LinkButton, PageHeader } from '@/components/ui'
import { AlertIcon } from '@/components/icons'
import { Modal, useLogoutConfirm } from '@/components/ui/modal/modal'
import { useAuth } from '@/contexts/auth-context'
import { useSystemVersion } from '@/contexts/system-version-context'
import { useToast } from '@/contexts/toast-context'
import { RegisteredDevicesPanel } from '@/features/profile/components/registered-devices-panel'
import { apiDelete } from '@/lib/api/client'
import { downloadLogsCsv } from '@/lib/utils/export'

function SettingsSection({ id, icon, title, description, children, className = '' }: {
  id: string
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <Card className="overflow-hidden">
        <CardHeader className="items-start justify-start gap-3 px-6 py-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-2)] text-[var(--accent-text)]">{icon}</span>
          <div>
            <h2 id={id} className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
            {description && <p className="mt-1 text-sm text-[var(--text-tertiary)]">{description}</p>}
          </div>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </section>
  )
}

export default function SettingsPage() {
  const { currentVersion } = useSystemVersion()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const confirmLogout = useLogoutConfirm()
  const [exporting, setExporting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      await downloadLogsCsv()
      toast.success('Logs exported successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function handleLogout() {
    if (!await confirmLogout()) return
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      toast.error('Failed to sign out. Please try again.')
      setLoggingOut(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await apiDelete('/auth/me')
      toast.success('Account successfully deleted.')
      window.location.href = '/login?msg=account_deleted'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Settings"
        description="Manage account access, registered devices, and your data."
        actions={<LinkButton href="/profile" variant="ghost" size="md" className="gap-1">View profile <ArrowUpRight size={15} aria-hidden="true" /></LinkButton>}
      />

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <SettingsSection
          id="registered-devices"
          icon={<Monitor size={18} aria-hidden="true" />}
          title="Registered devices"
          description="Review devices connected through the SecureGPT extension."
          className="lg:col-span-7"
        >
          <RegisteredDevicesPanel />
        </SettingsSection>

        <div className="grid gap-5 lg:col-span-5">
          <SettingsSection
            id="authentication"
            icon={<ShieldCheck size={18} aria-hidden="true" />}
            title="Authentication"
            description="Your connected account and sign-in controls."
          >
            <div className="px-6 py-5">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">Connected Google account</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="min-w-0 break-all text-sm font-semibold text-[var(--text-primary)]">{user?.email ?? 'Unavailable'}</p>
                {user && <Badge variant="success" dot>Connected</Badge>}
              </div>
            </div>
            <div className="border-t border-[var(--border)] px-6 py-4">
              <Button variant="secondary" type="button" loading={loggingOut} onClick={() => void handleLogout()} icon={<LogOut size={15} />}>
                Sign out
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            id="data-export"
            icon={<Database size={18} aria-hidden="true" />}
            title="Data export"
            description="Download a copy of your detection event logs."
          >
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                The CSV includes timestamps, actions, categories, and entity types.
              </p>
              <Button variant="secondary" type="button" className="mt-4" loading={exporting} onClick={() => void handleExport()} icon={<Download size={15} />}>
                Export logs (CSV)
              </Button>
            </div>
          </SettingsSection>
        </div>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <SettingsSection id="session" icon={<Lock size={18} aria-hidden="true" />} title="Session" description="How your dashboard session is protected.">
          <p className="px-6 py-5 text-sm leading-relaxed text-[var(--text-secondary)]">
            You are authenticated with a secure server-side session cookie. Sessions expire after 24 hours of inactivity and are bound to your browser fingerprint. Switching browsers or networks may require you to sign in again.
          </p>
        </SettingsSection>
        <SettingsSection id="about" icon={<Info size={18} aria-hidden="true" />} title="About" description="Product and privacy information.">
          <div className="space-y-3 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">SecureGPT Dashboard</span>
              <Badge variant="info">v{currentVersion}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Detection runs on-device in the browser extension. No raw PII is sent to our servers.
            </p>
          </div>
        </SettingsSection>
      </div>

      <section aria-labelledby="danger-zone">
        <Card className="border-[var(--danger-border)]">
          <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--danger-light)] text-[var(--danger)]">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 id="danger-zone" className="text-sm font-semibold text-[var(--text-primary)]">Delete account</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  Delete your profile, active sessions, and registered devices. Compliance data is retained for 3 years; security logs are deleted after 30 days. This action cannot be undone.
                </p>
              </div>
            </div>
            <Button variant="danger" type="button" className="shrink-0 self-start" onClick={() => setShowDeleteConfirm(true)}>Delete account</Button>
          </CardContent>
        </Card>
      </section>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delete your account?</h2>
            <p className="text-sm text-[var(--text-secondary)]">Your profile, active sessions, and registered devices will be removed.</p>
            <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-light)] p-4 text-sm text-[var(--danger)]">
              <p className="flex items-center gap-2 font-semibold"><AlertIcon size={16} aria-hidden="true" /> Data retention and deletion</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Account and telemetry data is retained for 3 years for compliance audits.</li>
                <li>Security and access logs are deleted after 30 days.</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" type="button" loading={deleting} onClick={() => void handleDeleteAccount()}>Delete account</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
