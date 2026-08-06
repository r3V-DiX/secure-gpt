// packages/secure-gpt-dashboard/src/features/team/hooks/use-team.ts
import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost } from '@/lib/api/client'
import { AuthUser, PaginatedResult } from '@/types'

export function useTeam() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiGet<PaginatedResult<AuthUser>>('/users?limit=100')
      setUsers(res.data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const inviteMember = async (email: string) => {
    try {
      await apiPost('/users/invite', { email })
      await fetchUsers()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to invite member' }
    }
  }

  return { users, loading, error, inviteMember, fetchUsers }
}
