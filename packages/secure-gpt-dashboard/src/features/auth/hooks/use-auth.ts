'use client'
// src/features/auth/hooks/use-auth.ts
// Re-exports from the single source of truth.
// The old version used localStorage + JWT — completely wrong for cookie-session auth.
// Use useAuth() from @/contexts/auth-context directly going forward.
export { useAuth } from '@/contexts/auth-context'