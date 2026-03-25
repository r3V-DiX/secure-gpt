'use client'
// packages/dashboard/src/features/auth/components/ProtectedRoute.tsx
// Declarative auth guard — wraps any component that needs authentication.
// The (app)/layout.tsx already handles redirect, so this is a lightweight
// render-null guard for use inside pages if needed.

import { useAuth } from '@/contexts/auth-context'

interface Props {
    children: React.ReactNode
    fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback = null }: Props) {
    const { user, loading } = useAuth()
    if (loading || !user) return <>{fallback}</>
    return <>{children}</>
}