// packages/dashboard/src/features/profile/utils/profile-formatters.utils.ts
import type { AuthUser } from '@/types'

export function formatRole(role: string): string {
    return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function formatMemberSince(createdAt: string): string {
    return new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
    })
}

export function formatLastLogin(lastLoginAt: string | null): string {
    if (!lastLoginAt) return 'Never'
    return new Date(lastLoginAt).toLocaleString()
}

export function getUserInitial(user: Pick<AuthUser, 'fullName' | 'email'>): string {
    return (user.fullName ?? user.email ?? '?').charAt(0).toUpperCase()
}