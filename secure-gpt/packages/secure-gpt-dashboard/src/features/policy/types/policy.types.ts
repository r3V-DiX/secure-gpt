// packages/dashboard/src/features/policy/types/policy.types.ts
export type { Policy, PIIConfig, CategoryConfig, PolicyAction } from '@/types'

export interface PolicyFormState {
    isDirty: boolean
    saving: boolean
    savedAt: Date | null
    error: string | null
}