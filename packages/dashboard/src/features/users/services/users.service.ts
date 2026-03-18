// ─────────────────────────────────────────────
// Users Service — Dashboard
// ─────────────────────────────────────────────

import apiClient from '@/lib/api/client'
import type { User } from '@securegpt/shared/types'

export interface UsersResponse {
  data: User[]
  pagination: { page: number; limit: number; total: number; total_pages: number }
}

export interface HighRiskUser {
  user_id: string
  email: string
  name: string
  department: string | null
  block_count: number
  window_days: number
}

export async function fetchUsers(params: { page?: number; limit?: number; search?: string; role?: string } = {}): Promise<UsersResponse> {
  const res = await apiClient.get('/users', { params })
  return res.data as UsersResponse
}

export async function fetchHighRiskUsers(): Promise<HighRiskUser[]> {
  const res = await apiClient.get('/users/high-risk')
  return (res.data as { data: HighRiskUser[] }).data
}

export async function fetchUser(userId: string): Promise<User> {
  const res = await apiClient.get(`/users/${userId}`)
  return (res.data as { data: User }).data
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await apiClient.put(`/users/${userId}/role`, { role })
}

export async function deactivateUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`)
}
