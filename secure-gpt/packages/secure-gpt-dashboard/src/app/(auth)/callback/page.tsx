"use client"
// src/app/(auth)/callback/page.tsx
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ShieldCheck } from "lucide-react"

export default function CallbackPage() {
  const { refresh } = useAuth()
  const router = useRouter()

  useEffect(() => {
    refresh()
      .then((me) => {
        const isAdmin = me?.role === 'super_admin' || me?.role === 'security_admin'
        if (isAdmin && typeof window !== 'undefined') {
          window.location.href = 'http://localhost:3001/dashboard'
        } else {
          router.replace("/dashboard")
        }
      })
      .catch(() => router.replace("/login?error=oauth_failed"))
  }, [refresh, router])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Animated logo */}
      <div
        className="size-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'var(--accent-light)',
          border: '1px solid var(--accent-border)',
          color: 'var(--accent-text)',
        }}
      >
        <ShieldCheck size={26} />
      </div>

      {/* Spinner */}
      <div className="relative size-8">
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: '2px solid var(--accent-border)',
            borderTopColor: 'var(--accent)',
          }}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Signing you in…
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Verifying your session
        </p>
      </div>
    </div>
  )
}