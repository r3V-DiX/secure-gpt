'use client'
// src/app/(app)/settings/page.tsx
import { useState } from 'react'
import { Download, LogOut, ShieldCheck, Database, Info, Lock, Monitor, Cpu } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { useToast } from '@/contexts/toast-context'
import { useLogoutConfirm, Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { AlertIcon } from '@/components/icons'
import { downloadLogsCsv } from '@/lib/utils/export'
import { apiDelete } from '@/lib/api/client'
import { RegisteredDevicesPanel } from '@/features/profile/components/registered-devices-panel'
import { useSystemVersion } from '@/contexts/system-version-context'

export default function SettingsPage() {
  const { currentVersion } = useSystemVersion()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const confirmLogout = useLogoutConfirm()
  const [exporting, setExporting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true)
      await apiDelete('/auth/me')
      toast.success('Account successfully deleted.')
      window.location.href = '/login?msg=account_deleted'
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account')
      setDeleting(false)
    }
  }

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
    const confirmed = await confirmLogout()
    if (!confirmed) return

    setLoggingOut(true)
    try {
      await logout()
    } catch {
      toast.error('Failed to sign out. Please try again.')
      setLoggingOut(false)
    }
  }

  return (
    <div className="w-full space-y-5 animate-fade-in pb-8">

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Authentication */}
      <Section icon={<ShieldCheck size={14} />} title="Authentication">
        <div className="px-5 py-4 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Google Account</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            style={{
              background: 'var(--success-light)',
              borderColor: 'var(--success-border)',
              color: 'var(--success)',
            }}>
            ● Connected
          </span>
        </div>

        <div className="px-5 py-4">
          <Button
            variant="secondary"
            onClick={handleLogout}
            loading={loggingOut}
            icon={<LogOut size={13} />}
          >
            Sign out
          </Button>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            You'll be asked to confirm before signing out.
          </p>
        </div>
      </Section>

      {/* Registered Devices */}
      <Section icon={<Monitor size={14} />} title="Registered Devices">
        <div className="px-5 py-4">
          <RegisteredDevicesPanel />
        </div>
      </Section>

      {/* Data export */}
      <Section icon={<Database size={14} />} title="Data Export">
        <div className="px-5 py-4">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Download all your detection event logs as a CSV file. Includes timestamps, actions, categories, and entity types.
          </p>
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={exporting}
            icon={<Download size={13} />}
          >
            Export my logs (CSV)
          </Button>
        </div>
      </Section>

      {/* Session */}
      <Section icon={<Lock size={14} />} title="Session">
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            You are authenticated via a secure server-side session cookie. Sessions expire after{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>24 hours</span>{' '}
            of inactivity and are bound to your browser fingerprint for security.
            Switching browsers or networks may require you to sign in again.
          </p>
        </div>
      </Section>

      {/* About */}
      <Section icon={<Info size={14} />} title="About">
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>SecureGPT Dashboard</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
              v{currentVersion}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Data Loss Prevention — all detection runs on-device in the browser extension.
            No raw PII is ever sent to our servers.
          </p>
        </div>
      </Section>

      {/* Danger Zone */}
      <div className="rounded-md border overflow-hidden mt-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--danger-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2"
          style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-light)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--danger)' }}>
            Danger Zone
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Delete Account</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Permanently delete your account and all associated data.
              <strong> Note:</strong> Under compliance guidelines, your account data will be retained for 3 years,
              and security logs will be permanently deleted after 30 days. This action cannot be undone.
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer hover:opacity-90"
              style={{ background: 'var(--danger)' }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Are you absolutely sure?</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              This will permanently delete your user profile, active sessions, and registered devices.
            </p>
            <div className="p-3.5 rounded-xl border text-[11px] space-y-1.5"
              style={{ background: 'var(--danger-light)', borderColor: 'var(--danger-border)', color: 'var(--danger)' }}>
              <p className="font-semibold flex items-center gap-1.5">
                <AlertIcon size={14} className="shrink-0 text-[var(--danger)]" />
                Data Retention & Deletion Policy:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Account and telemetry data will be retained for 3 years for compliance audits.</li>
                <li>Associated security and access logs will be permanently deleted after 30 days.</li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer hover:opacity-90"
              style={{ background: 'var(--danger)' }}
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Section({ icon, title, children }: {
  icon: React.ReactNode; title: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-md border overflow-hidden"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
      <div className="px-5 py-3 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
        <span style={{ color: 'var(--accent-text)' }}>{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  )
}