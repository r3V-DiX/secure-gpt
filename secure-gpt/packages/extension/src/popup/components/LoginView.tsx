// packages/extension/src/popup/components/LoginView.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button/button'

interface LoginViewProps {
  onLogin: () => void
  onLoginWithMicrosoft: () => void
  onRequestOtp: (email: string) => Promise<void>
  onVerifyOtp: (email: string, code: string) => Promise<void>
  onLoginWithEmail: (email: string) => Promise<void>
}

export function LoginView({
  onLogin,
  onLoginWithMicrosoft,
  onRequestOtp,
  onVerifyOtp,
  onLoginWithEmail,
}: LoginViewProps) {
  const [authMode, setAuthMode] = useState<'options' | 'otp'>('options')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  const [devEmail, setDevEmail] = useState('')
  const [devLoading, setDevLoading] = useState(false)

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otpEmail.trim()) return
    try {
      setOtpLoading(true)
      setOtpError(null)
      await onRequestOtp(otpEmail.trim())
      setOtpSent(true)
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || err?.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otpCode.trim()) return
    try {
      setOtpLoading(true)
      setOtpError(null)
      await onVerifyOtp(otpEmail.trim(), otpCode.trim())
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || err?.message || 'Invalid or expired OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleDevSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!devEmail) return
    try {
      setDevLoading(true)
      await onLoginWithEmail(devEmail)
    } catch (err: any) {
      alert(err.message || 'Developer login failed')
    } finally {
      setDevLoading(false)
    }
  }

  return (
    <div className="w-[320px] px-5 py-6 flex flex-col items-center font-[var(--font-jakarta)] text-center shadow-xl rounded-lg border"
      style={{ background: 'var(--bg-popup)', borderColor: 'var(--border)' }}>
      <div className="size-11 bg-[#091a2a] rounded-lg flex items-center justify-center p-2 mb-3 shadow-sm border border-slate-700/50">
        <img src="/icons/icon128.png" alt="SecureGPT" className="w-full h-full object-contain" />
      </div>
      <div className="text-base font-bold tracking-tight mb-0.5 text-[var(--text-primary)]">SecureGPT</div>
      <div className="text-xs font-medium leading-relaxed mb-4 text-[var(--text-tertiary)]">
        Sign in to enforce data privacy and secure your AI interactions.
      </div>

      {authMode === 'options' ? (
        <div className="w-full space-y-2.5">
          <Button 
            variant="secondary"
            size="md"
            fullWidth
            onClick={onLogin}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
          >
            Sign in with Google
          </Button>

          <Button 
            variant="secondary"
            size="md"
            fullWidth
            onClick={onLoginWithMicrosoft}
            icon={
              <svg className="size-3.5 shrink-0" viewBox="0 0 21 21">
                <path fill="#f25022" d="M1 1h9v9H1z" />
                <path fill="#00a4ef" d="M1 11h9v9H1z" />
                <path fill="#7fba00" d="M11 1h9v9h-9z" />
                <path fill="#ffb900" d="M11 11h9v9h-9z" />
              </svg>
            }
          >
            Sign in with Microsoft
          </Button>

          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">OR</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => {
              setAuthMode('otp')
              setOtpError(null)
            }}
            icon={
              <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          >
            Sign in with Email OTP
          </Button>
        </div>
      ) : (
        <div className="w-full text-left">
          {otpError && (
            <div className="mb-2.5 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] leading-tight">
              {otpError}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold block mb-1 text-[var(--text-primary)]">
                  Work or Personal Email
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border text-xs bg-[var(--bg-surface-2)] text-[var(--text-primary)] border-[var(--border-2)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all font-medium"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={otpLoading}
                disabled={!otpEmail}
              >
                Send Verification Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-2.5">
              <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] leading-tight">
                Code sent to <span className="font-bold">{otpEmail}</span>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-[var(--text-primary)]">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-md border text-sm font-mono tracking-widest text-center bg-[var(--bg-surface-2)] text-[var(--text-primary)] border-[var(--border-2)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all font-bold"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={otpLoading}
                disabled={otpCode.length < 6}
              >
                Verify & Sign In
              </Button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false)
                  setOtpCode('')
                  setOtpError(null)
                }}
                className="w-full text-center text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors pt-0.5 cursor-pointer"
              >
                ← Use a different email
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-[var(--border)] mt-3">
            <button
              type="button"
              onClick={() => {
                setAuthMode('options')
                setOtpError(null)
              }}
              className="w-full text-center text-[11px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              ← Back to all sign in options
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleDevSubmit} className="w-full mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Developer Bypass</span>
        </div>
        <input
          type="email"
          placeholder="Enter test user email..."
          aria-label="Developer test user email"
          value={devEmail}
          onChange={(e) => setDevEmail(e.target.value)}
          className="w-full h-7 px-2.5 rounded-md border text-xs bg-[var(--bg-surface-2)] text-[var(--text-primary)] border-[var(--border-2)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all font-medium"
          required
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          fullWidth
          loading={devLoading}
          disabled={!devEmail}
        >
          Bypass Login
        </Button>
      </form>
    </div>
  )
}
