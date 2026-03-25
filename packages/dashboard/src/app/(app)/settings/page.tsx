'use client'
// src/app/(app)/settings/page.tsx
import { useState } from 'react'
import { Download, Loader2, LogOut, ShieldCheck, Database, Info, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useLogoutConfirm } from '@/components/ui/modal/modal'
import { downloadLogsCsv } from '@/lib/utils/export'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const confirmLogout = useLogoutConfirm()
  const [exporting, setExporting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

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
    <div className="max-w-[720px] space-y-5 animate-fade-in pb-8">

      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
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
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--danger-light)',
              borderColor: 'var(--danger-border)',
              color: 'var(--danger)',
            }}
          >
            {loggingOut
              ? <Loader2 size={13} className="animate-spin" />
              : <LogOut size={13} />
            }
            {loggingOut ? 'Signing out…' : 'Sign out of all sessions'}
          </button>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            You'll be asked to confirm before signing out.
          </p>
        </div>
      </Section>

      {/* Data export */}
      <Section icon={<Database size={14} />} title="Data Export">
        <div className="px-5 py-4">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Download all your detection event logs as a CSV file. Includes timestamps, actions, categories, and entity types.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-2)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-2)'}
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {exporting ? 'Exporting…' : 'Export my logs (CSV)'}
          </button>
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
              v1.0.0
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Data Loss Prevention — all detection runs on-device in the browser extension.
            No raw PII is ever sent to our servers.
          </p>
        </div>
      </Section>
    </div>
  )
}

function Section({ icon, title, children }: {
  icon: React.ReactNode; title: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border overflow-hidden"
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