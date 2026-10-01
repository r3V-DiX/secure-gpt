'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/shared/FormField';
import { toast } from '@/hooks/use-toast';
import {
  ArrowRight,
  Mail,
  ShieldCheck,
  RotateCw,
  Info,
  Sparkles,
  Lock,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';

import { authApi } from '@/lib/api/auth.api';
import { useAuth } from '@/hooks/use-auth';
import { GuestGuard } from '@/components/shared/GuestGuard';
import { isValidEmail, isCorporateEmail, isValidOtpCode } from '@/lib/utils/validation';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendSec, setResendSec] = useState(42);

  const inputRef0 = useRef<HTMLInputElement>(null);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const inputRef3 = useRef<HTMLInputElement>(null);
  const inputRef4 = useRef<HTMLInputElement>(null);
  const inputRef5 = useRef<HTMLInputElement>(null);

  const otpInputRefs = [inputRef0, inputRef1, inputRef2, inputRef3, inputRef4, inputRef5];

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error('Email Required', 'Please enter your work email address.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      toast.error('Invalid Email Format', 'Please enter a valid work email address (e.g. alex@acme.com).');
      return;
    }
    if (!isCorporateEmail(cleanEmail)) {
      const domain = cleanEmail.split('@')[1] || 'gmail.com';
      toast.error(
        'Login Failed',
        `Personal email domain (@${domain}) is not permitted. Please use your corporate or business email address (e.g. name@company.com).`
      );
      return;
    }
    setLoading(true);
    try {
      await authApi.requestLoginOtp(cleanEmail);
      setStep('otp');
      toast.success('Verification code sent!', `Sent a 6-digit code to ${cleanEmail}`);
    } catch (err: any) {
      toast.error('Login Failed', err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs[nextIdx].current?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (!isValidOtpCode(code)) {
      toast.error('Incomplete Passcode', 'Please enter all 6 numeric digits of your verification code.');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyLoginOtp(email, code);
      const profile = await refreshUser();
      toast.success(
        `Welcome back${profile?.fullName ? `, ${profile.fullName}` : ''}!`,
        'Logged into Rivedix TPRM',
      );
      if (profile?.side === 'vendor') {
        router.push('/portal/dashboard');
      } else if (profile?.isOnboarded === false) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error('Verification Failed', err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await authApi.requestLoginOtp(email);
      toast.success('New code sent!', `A fresh 6-digit verification code was sent to ${email}`);
      setResendSec(59);
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to resend code');
    }
  };

  return (
    <GuestGuard>
      <div className="min-h-screen bg-[#F8FAFC] text-[var(--ink-1)] flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background Ambient Glows & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[430px] mx-auto space-y-5 sm:space-y-6 relative z-10 px-1 sm:px-0">
        {/* Brand Logo Header */}
        <div className="brand justify-center mb-4 sm:mb-6">
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-name">Rivedix TPRM</div>
            <div className="brand-sub">Enterprise Risk Platform</div>
          </div>
        </div>

        {/* Elevated Glassmorphic Card */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-7 md:p-9 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] space-y-5 sm:space-y-6">
          {/* STEP 1: Email Input */}
          {step === 'email' && (
            <div className="space-y-5 sm:space-y-6 animate-fadeIn">
              {/* Step indicator badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[10.5px] sm:text-[11.5px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Step 1 of 2 · Work Email
                </span>
                <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400 font-mono">OTP Login</span>
              </div>

              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                  Sign in to your workspace
                </h1>
                <p className="text-xs text-slate-500 mt-1 sm:mt-1.5 leading-relaxed">
                  Enter your corporate email address to receive a 6-digit one-time passcode.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <FormField label="Work Email Address" required>
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono shadow-2xs"
                    />
                    <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                  </div>
                </FormField>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn disabled:opacity-85 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2 text-white/95 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-200 shrink-0" />
                      <span>Generating OTP Code...</span>
                    </span>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Vendor Portal Notice */}
              <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 text-center leading-relaxed shadow-2xs">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  Responding to a vendor assessment?{' '}
                  <Link href="/portal-login" className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5">
                    Sign in to Vendor Portal →
                  </Link>
                </div>
              </div>

              {/* Account Link */}
              <div className="pt-1 text-center text-xs text-slate-500">
                Don&apos;t have an organization account?{' '}
                <Link href="/register" className="font-bold text-blue-600 hover:underline">
                  Create Workspace
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: OTP Passcode Input */}
          {step === 'otp' && (
            <div className="space-y-5 sm:space-y-6 animate-fadeIn">
              {/* Step indicator badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[10.5px] sm:text-[11.5px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Step 2 of 2 · Verification
                </span>
                <span className="text-[10.5px] sm:text-[11px] font-semibold text-emerald-600 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                </span>
              </div>

              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                  Enter verification code
                </h1>
                <p className="text-xs text-slate-500 mt-1 sm:mt-1.5 leading-relaxed">
                  We sent a 6-digit code to your email. It expires in <strong className="text-slate-900 font-bold">10 minutes</strong>.
                </p>
              </div>

              {/* Email preview chip */}
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 font-bold text-blue-950 truncate font-mono min-w-0">
                  {email}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="px-2.5 sm:px-3 py-1 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-lg text-[11px] sm:text-[11.5px] font-bold transition-all shadow-2xs cursor-pointer flex-shrink-0"
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    6-Digit Passcode
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2 otp-row">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpInputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className={`h-11 sm:h-13 text-lg sm:text-xl font-extrabold font-mono border rounded-lg sm:rounded-xl text-center min-w-0 w-full transition-all duration-150 ${
                          digit
                            ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs scale-102 ring-2 ring-blue-500/10'
                            : 'bg-slate-50/50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn disabled:opacity-85 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2 text-white/95 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-200 shrink-0" />
                      <span>Verifying Passcode...</span>
                    </span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify &amp; Sign In</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-slate-500 space-x-1.5 pt-1">
                <span>Didn&apos;t receive code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" /> Resend
                </button>
                <span className="text-slate-400 font-mono">in 0:{resendSec < 10 ? `0${resendSec}` : resendSec}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
    </GuestGuard>
  );
}