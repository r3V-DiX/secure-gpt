'use client'

import { Input, Button, FormField } from '@/components/ui'
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

export function EmailOtpForm({ roleType, email, setEmail, otpCode, setOtpCode, otpSent,
  setOtpSent, otpLoading, privacyAccepted, onRequestOTP, onVerifyOTP }: EmailOtpFormProps) {
  if (!otpSent) {
    return <form onSubmit={onRequestOTP} className="space-y-4">
      <FormField label={roleType === 'employer' ? 'Corporate Admin Email' : roleType === 'employee' ? 'Company Email' : 'Your Email'} required>
        <Input controlSize="lg" type="email" autoComplete="email" icon={<Mail size={15} />}
          placeholder={roleType === 'user' ? 'you@example.com' : 'name@yourcompany.com'}
          value={email} onChange={event => setEmail(event.target.value)} required />
      </FormField>
      <Button variant="primary" size="lg" type="submit" fullWidth loading={otpLoading}
        disabled={!email || !privacyAccepted}>
        {otpLoading ? 'Sending Code...' : 'Send Verification OTP'} <ArrowRight size={14} />
      </Button>
    </form>
  }
  return <form onSubmit={onVerifyOTP} className="space-y-4 animate-fade-in">
    <div role="status" className="flex items-center gap-2 rounded-lg border border-[var(--success-border)] bg-[var(--success-light)] p-3 text-xs text-[var(--success)]">
      <CheckCircle2 size={16} /> Code sent to <b>{email}</b>
    </div>
    <FormField label="Enter 6-Digit OTP Code" required>
      <Input controlSize="lg" type="text" inputMode="numeric" autoComplete="one-time-code"
        maxLength={6} placeholder="123456" icon={<KeyRound size={15} />} value={otpCode}
        onChange={event => setOtpCode(event.target.value)} required className="font-mono" />
    </FormField>
    <Button variant="primary" size="lg" type="submit" fullWidth loading={otpLoading} disabled={otpCode.length < 6}>
      {otpLoading ? 'Verifying...' : 'Verify & Enter Dashboard'}
    </Button>
    <Button variant="ghost" size="lg" type="button" fullWidth onClick={() => setOtpSent(false)}>
      ← Use a different email
    </Button>
  </form>
}
