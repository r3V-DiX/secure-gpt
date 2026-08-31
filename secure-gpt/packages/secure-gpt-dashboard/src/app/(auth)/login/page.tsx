'use client'
// packages/dashboard/src/app/(auth)/login/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { apiPost } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Mail, KeyRound, Building2, UserCheck, User, ArrowRight, CheckCircle2, Zap } from 'lucide-react'

export default function LoginPage() {
  const [roleType, setRoleType] = useState<'employer' | 'employee' | 'user'>('employer')

  // OTP State
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

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
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!otpCode.trim()) return
    try {
      setOtpLoading(true)
      await apiPost('/auth/otp/verify', {
        email: email.trim(),
        code: otpCode.trim(),
        role_type: roleType,
      })
      toast.success('Signed in successfully!')
      window.location.href = '/callback'
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired OTP')
    } finally {
      setOtpLoading(false)
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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          opacity: 0.6,
        }}
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
            <p className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              SecureGPT
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Enterprise DLP & Privacy Platform
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Sign in to SecureGPT
        </h1>
        <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
          Choose your login role and authentication method
        </p>

        {/* ── Role Selector (Employer / Employee / Personal) ───────────────── */}
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
        {!otpSent ? (
          <form onSubmit={handleRequestOTP} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                {roleType === 'employer'
                  ? 'Corporate Admin Email'
                  : roleType === 'employee'
                  ? 'Company Email'
                  : 'Your Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder={
                    roleType === 'user'
                      ? 'you@example.com'
                      : 'name@yourcompany.com'
                  }
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Mail size={15} className="absolute left-3 top-3" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={otpLoading || !email || !privacyAccepted}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              {otpLoading ? 'Sending Code...' : 'Send Verification OTP'} <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-3.5 animate-fade-in">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} /> Code sent to <b className="font-semibold">{email}</b>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                Enter 6-Digit OTP Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm font-mono tracking-widest border focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
                <KeyRound size={15} className="absolute left-3 top-3.5" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpCode.length < 6}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {otpLoading ? 'Verifying...' : 'Verify & Enter Dashboard'}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-center text-xs font-semibold transition-colors pt-1 cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Use a different email
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-tertiary)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={!privacyAccepted}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          style={{
            borderColor: 'var(--border-strong)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
        >
          <GoogleIcon />
          Continue with Google OAuth
        </button>

        {/* Developer Quick-Bypass */}
        {isDev && (
          <form onSubmit={handleDevLogin} className="mt-5 pt-5 border-t space-y-2.5" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Zap size={13} className="fill-current" /> Developer Quick-Bypass
              </p>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">dev-mode</span>
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Test email..."
                value={devEmail}
                onChange={e => setDevEmail(e.target.value)}
                required
                className="flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={devLoading || !devEmail || !privacyAccepted}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm shadow-amber-500/20"
              >
                {devLoading ? 'Entering...' : 'Instant Login'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 pt-5 mt-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="text-xs font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}