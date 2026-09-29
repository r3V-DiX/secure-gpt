'use client'
// packages/dashboard/src/app/(auth)/login/page.tsx

import { Checkbox } from '@/components/ui'
import { useState } from 'react'
import Link from 'next/link'
import { apiPost } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { EmailOtpForm } from '@/features/auth/components/EmailOtpForm'
import { OAuthButtons } from '@/features/auth/components/OAuthButtons'
import { DevQuickBypass } from '@/features/auth/components/DevQuickBypass'
import { PendingDomainModal } from '@/features/auth/components/PendingDomainModal'
import { RoleSelector } from '@/features/auth/components/RoleSelector'
import { LoginFooter } from '@/features/auth/components/LoginFooter'
import { useSystemVersion } from '@/contexts/system-version-context'

export default function LoginPage() {
  const { currentVersion } = useSystemVersion()
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

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    if (!privacyAccepted) {
      toast.error('You must accept the Privacy Policy and Terms of Service to continue.')
      return
    }
    setOtpLoading(true)
    try {
      await apiPost('/auth/request-otp', {
        email: email.trim(),
        role_type: roleType,
      })
      setOtpSent(true)
      toast.success(`Verification code sent to ${email}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent, forcePersonalSignup = false) {
    if (e && e.preventDefault) e.preventDefault()
    if (!otpCode.trim() && !forcePersonalSignup) return

    if (forcePersonalSignup) {
      setPersonalSignupLoading(true)
    } else {
      setOtpLoading(true)
    }

    try {
      const res = await apiPost<{
        user: any
        redirect_url?: string
        requires_domain_choice?: boolean
        org_name?: string
        domain?: string
      }>('/auth/verify-otp', {
        email: email.trim(),
        code: otpCode.trim(),
        role_type: roleType,
        force_personal: forcePersonalSignup,
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

      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div
        className="relative w-full max-w-[420px] rounded-lg p-7 transition-all border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="size-9 rounded-md flex items-center justify-center border overflow-hidden shrink-0" style={{ background: '#091a2a', borderColor: 'var(--border)' }}>
            <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                SecureGPT
              </p>
              {isAdminMode && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent-border)]">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {isAdminMode ? 'Super Admin & Governance Console' : 'Enterprise DLP & Privacy Platform'}
            </p>
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          {isAdminMode ? 'Sign in to Admin Console' : 'Sign in to SecureGPT'}
        </h1>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
          {isAdminMode
            ? 'Enter your Super Admin credentials to access the global control plane.'
            : 'Choose your login role and authentication method'}
        </p>

        {!isAdminMode && (
          <RoleSelector
            roleType={roleType}
            setRoleType={setRoleType}
            setDevPersona={setDevPersona}
            setDevEmail={setDevEmail}
          />
        )}

        <div className="flex items-start gap-2.5 mb-5">
          <Checkbox
            id="privacy-checkbox"

            checked={privacyAccepted}
            onChange={e => setPrivacyAccepted(e.target.checked)}
            className="mt-0.5"
          />
          <label htmlFor="privacy-checkbox" className="text-[12px] leading-normal select-none cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            I agree to the{' '}
            <Link href="/privacy" className="underline font-semibold hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="underline font-semibold hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>
              Terms of Service
            </Link>.
          </label>
        </div>

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

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-secondary)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <OAuthButtons
          privacyAccepted={privacyAccepted}
          onGoogle={handleGoogle}
          onMicrosoft={handleMicrosoft}
        />

        {isDev && (
          <DevQuickBypass
            devEmail={devEmail}
            setDevEmail={setDevEmail}
            devLoading={devLoading}
            privacyAccepted={privacyAccepted}
            onDevLogin={handleDevLogin}
          />
        )}

        <LoginFooter currentVersion={currentVersion} />
      </div>
    </div>
  )
}
