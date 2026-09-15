'use client'

import { Mail, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react'

interface EmailOtpFormProps {
  roleType: 'employer' | 'employee' | 'user'
  email: string
  setEmail: (val: string) => void
  otpCode: string
  setOtpCode: (val: string) => void
  otpSent: boolean
  setOtpSent: (val: boolean) => void
  otpLoading: boolean
  privacyAccepted: boolean
  onRequestOTP: (e: React.FormEvent) => Promise<void>
  onVerifyOTP: (e: React.FormEvent) => Promise<void>
}

export function EmailOtpForm({
  roleType,
  email,
  setEmail,
  otpCode,
  setOtpCode,
  otpSent,
  setOtpSent,
  otpLoading,
  privacyAccepted,
  onRequestOTP,
  onVerifyOTP,
}: EmailOtpFormProps) {
  if (!otpSent) {
    return (
      <form onSubmit={onRequestOTP} className="space-y-3.5">
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
              placeholder={roleType === 'user' ? 'you@example.com' : 'name@yourcompany.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
    )
  }

  return (
    <form onSubmit={onVerifyOTP} className="space-y-3.5 animate-fade-in">
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
            onChange={(e) => setOtpCode(e.target.value)}
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
  )
}
