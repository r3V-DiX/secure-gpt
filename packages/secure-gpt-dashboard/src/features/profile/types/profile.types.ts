// packages/dashboard/src/features/profile/types/profile.types.ts
export type { AuthUser, Device, UserRole } from '@/types'

export interface ProfilePageState {
    loading: boolean
    error: string | null
}