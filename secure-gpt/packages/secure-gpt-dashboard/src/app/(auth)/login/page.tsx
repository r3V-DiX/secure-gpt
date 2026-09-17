'use client'
// packages/dashboard/src/app/(auth)/login/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { apiPost } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Building2, UserCheck, User } from 'lucide-react'
import { EmailOtpForm } from '@/features/auth/components/EmailOtpForm'
import { OAuthButtons } from '@/features/auth/components/OAuthButtons'
import { DevQuickBypass } from '@/features/auth/components/DevQuickBypass'
import { PendingDomainModal } from '@/features/auth/components/PendingDomainModal'

export default function LoginPage() {
  const [roleType, setRoleType] = useState<'employer' | 'employee' | 'user'>('employer')

  // OTP State
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  // Pending Domain Choice Modal State
  const [pendingDomainOrg, setPendingDomainOrg] = useState<{ orgName: string; domain: string } | null>(null)
  const [personalSignupLoading, setPersonalSignupLoading] = useState(false)

  // Dev Quick-Bypass State
  const [devEmail, setDevEmail] = useState('admin@blackvector.online')
  const [devPersona, setDevPersona] = useState<'employer' | 'employee' | 'user'>('employer')
  const [devLoading, setDevLoading] = useState(false)

  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'
  const { toast } = useToast()

  function handleGoogle() {
    if (!privacyAccepted) {
      toast.error('You must accept the Privacy Policy and Terms of Service to continue.')
      return
    }
    window.location.href = '/api/v1/auth/google'
  }

  function handleMicrosoft() {
    if (!privacyAccepted) {
      toast.error('You must accept the Privacy Policy and Terms of Service to continue.')
      return
    }
    window.location.href = '/api/v1/auth/microsoft'
  }

  // ── Request Email OTP ───────────────────────────────────────────────────────
  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    if (!privacyAccepted) {
      toast.error('You must accept the Privacy Policy and Terms of Service to continue.')
      return
    }
    try {
      setOtpLoading(true)
      await apiPost('/auth/otp/request', {
        email: email.trim(),
        role_type: roleType,
      })
      setOtpSent(true)
      toast.success('Verification code sent to your email!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Verify Email OTP ────────────────────────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent, forcePersonal = false) {
    if (e?.preventDefault) e.preventDefault()
    if (!otpCode.trim()) return
    try {
      if (forcePersonal) {
        setPersonalSignupLoading(true)
      } else {
        setOtpLoading(true)
      }

      const res = await apiPost<{
        requires_domain_choice?: boolean
        org_name?: string
        domain?: string
        redirect_url?: string
      }>('/auth/otp/verify', {
        email: email.trim(),
        code: otpCode.trim(),
        role_type: roleType,
        force_personal: forcePersonal,
      })

      if (res?.requires_domain_choice) {
        setPendingDomainOrg({
          orgName: res.org_name || 'Your Company',
          domain: res.domain || email.split('@')[1] || '',
        })
        return
      }

      toast.success('Signed in successfully!')
      if (res?.redirect_url) {
        window.location.href = res.redirect_url
      } else {
        window.location.href = '/callback'
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired OTP')
    } finally {
      setOtpLoading(false)
      setPersonalSignupLoading(false)
    }
  }

  // ── Dev Login ───────────────────────────────────────────────────────────────
  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!devEmail) return
    if (!privacyAccepted) {
      toast.error('You must accept the Privacy Policy and Terms of Service to continue.')
      return
    }
    try {
      setDevLoading(true)
      await apiPost('/auth/dev-login', {
        email: devEmail.trim(),
        persona: devPersona,
      })
      toast.success(`Signed in as ${devPersona}!`)
      window.location.href = '/callback'
    } catch (err: any) {
      toast.error(err.message || 'Developer login failed')
    } finally {
      setDevLoading(false)
    }
  }

  const isAdminMode = process.env.NEXT_PUBLIC_APP_MODE === 'admin'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Pending Domain Choice Modal */}
      {pendingDomainOrg && (
        <PendingDomainModal
          orgName={pendingDomainOrg.orgName}
          domain={pendingDomainOrg.domain}
          loading={personalSignupLoading}
          onContinuePersonal={() => handleVerifyOTP({ preventDefault: () => {} } as any, true)}
          onCancel={() => {
            setPendingDomainOrg(null)
            setOtpSent(false)
            setOtpCode('')
          }}
        />
      )}

      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.6,
        }}
        aria-hidden
      />

      {/* Glow blob */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)' }}
        aria-hidden
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[440px] rounded-3xl p-8 shadow-2xl transition-all border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-11 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden shrink-0" style={{ background: '#091a2a' }}>
            <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                SecureGPT
              </p>
              {isAdminMode && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/20">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {isAdminMode ? 'Super Admin & Governance Console' : 'Enterprise DLP & Privacy Platform'}
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          {isAdminMode ? 'Sign in to Admin Console' : 'Sign in to SecureGPT'}
        </h1>
        <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
          {isAdminMode
            ? 'Enter your Super Admin credentials to access the global control plane.'
            : 'Choose your login role and authentication method'}
        </p>

        {/* ── Role Selector (Shown only on standard tenant app, hidden on admin portal) ── */}
        {!isAdminMode && (
          <div className="mb-5">
            <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
              I am signing in as:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => {
                  setRoleType('employer')
                  setDevPersona('employer')
                  setDevEmail('admin@acmecorp.com')
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  roleType === 'employer'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/60'
                }`}
              >
                <Building2 size={13} /> Employer
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoleType('employee')
                  setDevPersona('employee')
                  setDevEmail('developer@acmecorp.com')
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  roleType === 'employee'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/60'
                }`}
              >
                <UserCheck size={13} /> Employee
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoleType('user')
                  setDevPersona('user')
                  setDevEmail('john.doe@gmail.com')
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  roleType === 'user'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/60'
                }`}
              >
                <User size={13} /> Personal
              </button>
            </div>
          </div>
        )}

        {/* Privacy Policy Checkbox */}
        <div className="flex items-start gap-2.5 mb-5">
          <input
            id="privacy-checkbox"
            type="checkbox"
            checked={privacyAccepted}
            onChange={e => setPrivacyAccepted(e.target.checked)}
            className="mt-0.5 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="privacy-checkbox" className="text-xs leading-normal select-none cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            I agree to the{' '}
            <Link href="/privacy" className="underline font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="underline font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
              Terms of Service
            </Link>.
          </label>
        </div>

        {/* ── Email OTP Form ──────────────────────────────────────────────── */}
        <EmailOtpForm
          roleType={roleType}
          email={email}
          setEmail={setEmail}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          otpSent={otpSent}
          setOtpSent={setOtpSent}
          otpLoading={otpLoading}
          privacyAccepted={privacyAccepted}
          onRequestOTP={handleRequestOTP}
          onVerifyOTP={handleVerifyOTP}
        />

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-tertiary)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* OAuth buttons */}
        <OAuthButtons
          privacyAccepted={privacyAccepted}
          onGoogle={handleGoogle}
          onMicrosoft={handleMicrosoft}
        />

        {/* Developer Quick-Bypass */}
        {isDev && (
          <DevQuickBypass
            devEmail={devEmail}
            setDevEmail={setDevEmail}
            devLoading={devLoading}
            privacyAccepted={privacyAccepted}
            onDevLogin={handleDevLogin}
          />
        )}

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 pt-5 mt-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="text-xs font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>
            ← Back to home
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/versions" className="hover:text-[var(--accent)] hover:underline transition-colors flex items-center gap-1">
              <span>Version History</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] font-semibold">
                v1.1.4
              </span>
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
