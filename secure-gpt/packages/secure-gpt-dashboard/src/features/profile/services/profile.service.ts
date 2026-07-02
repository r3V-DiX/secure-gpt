// src/features/profile/services/profile.service.ts
import { apiGet } from '@/lib/api/client'
import type { AuthUser, Device } from '@/types'

export async function fetchProfile(): Promise<AuthUser> {
    return apiGet<AuthUser>('/auth/me')
}

export async function fetchMyDevices(): Promise<Device[]> {
    // Returns paginated but we just want first page of devices for profile view
    const res = await import('@/lib/api/client').then(m =>
        m.apiGetPaginated<Device>('/devices', { page: 1, page_size: 50 })
    )
    return res.data
}