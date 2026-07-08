'use client'
// packages/dashboard/src/app/(auth)/login/page.tsx
// Login redirects to /api/v1/auth/google which Next.js rewrites to backend.
// Backend does OAuth → redirects to GOOGLE_REDIRECT_URI which must be:
// http://localhost:3000/api/auth/google/callback
// That Next.js route plants the cookie on localhost:3000 then redirects to /callback.

import { useState } from 'react'
import Link from 'next/link'
import { apiPost } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'

export default function LoginPage() {
  const [devEmail, setDevEmail] = useState('')
  const [devLoading, setDevLoading] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'
  const { toast } = useToast()

  // OTP Login State
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!devEmail) return
    try {
      setDevLoading(true)
      await apiPost('/auth/dev-login', { email: devEmail })
      toast.success('Bypass login successful!')
      window.location.href = '/callback'
    } catch (err: any) {
      toast.error(err.message || 'Developer login failed')
    } finally {
      setDevLoading(false)
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      setOtpLoading(true)
      await apiPost('/auth/otp/request', { email })
      toast.success('Verification code sent to your email!')
      setOtpSent(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otpCode) return
    try {
      setOtpLoading(true)
      const res = await apiPost<any>('/auth/otp/verify', { email, code: otpCode })
      toast.success('Login successful!')
      window.location.href = '/callback'
    } catch (err: any) {
      toast.error(err.message || 'Invalid verification code')
    } finally {
      setOtpLoading(false)
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

      {/* Glow blob */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)' }}
        aria-hidden
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[400px] rounded-2xl p-8"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-2)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={{ background: '#091a2a' }}>
            <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              SecureGPT
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              DLP Dashboard
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Welcome back
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Sign in to your security dashboard
        </p>

        {/* Auth forms */}
        {!otpSent ? (
          /* OTP Request Form */
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Admin Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 mt-1.5 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-white focus:ring-[var(--accent)] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={otpLoading || !email}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ background: 'var(--accent)' }}
            >
              {otpLoading ? 'Sending...' : 'Request Verification Code'}
            </button>
          </form>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-xs leading-normal" style={{ color: 'var(--text-secondary)' }}>
              A 6-digit verification code has been sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            </p>
            <div>
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Verification Code</label>
              <input
                type="text"
                placeholder="e.g. 123456"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-3.5 py-2.5 mt-1.5 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-white focus:ring-[var(--accent)] text-center tracking-[0.2em] font-bold outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={otpLoading || otpCode.length < 6}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ background: 'var(--accent)' }}
            >
              {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtpCode(''); }}
                className="text-xs underline hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                Change Email / Resend Code
              </button>
            </div>
          </form>
        )}

        {/* Developer login (dev only) */}
        {isDev && !otpSent && (
          <form onSubmit={handleDevLogin} className="mt-6 pt-6 border-t border-[var(--border)] space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/30">
              Developer Quick-Bypass
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter test user email..."
                value={devEmail}
                onChange={e => setDevEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-white focus:ring-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={devLoading || !devEmail}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {devLoading ? 'Signing in...' : 'Sign in as Test Email'}
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>secured by</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
          {['End-to-end encrypted', 'PII stays on-device', 'Session-based auth'].map(t => (
            <span key={t} className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: 'var(--text-tertiary)' }}>
              <span style={{ color: 'var(--success)' }}>✓</span>
              {t}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex flex-col items-center gap-3 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="text-xs font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>
            ← Back to home
          </Link>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs font-medium hover:underline" style={{ color: 'var(--text-tertiary)' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs font-medium hover:underline" style={{ color: 'var(--text-tertiary)' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}