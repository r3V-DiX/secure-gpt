'use client'
// src/app/not-found.tsx
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 animate-fade-in relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Glow */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center max-w-sm">
        <p
          className="text-[90px] font-bold leading-none tracking-tighter"
          style={{
            background: 'linear-gradient(180deg, var(--border-strong) 0%, var(--border) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </p>

        <div
          className="mt-2 size-12 rounded-md flex items-center justify-center mb-5"
          style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
          }}
        >
          <ShieldAlert size={22} />
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          Page not found
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          This page doesn&apos;t exist or you don&apos;t have access to it.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = 'var(--accent)'}
        >
          <ArrowLeft size={14} />
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}