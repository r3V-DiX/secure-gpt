// packages/secure-gpt-dashboard/src/features/team/hooks/use-team.ts
import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPatch } from '@/lib/api/client'
import { AuthUser, Department, Organisation } from '@/types'

export function useTeam() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organisation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true)
      const usersRes = await apiGet<any>('/users?limit=100').catch(() => [])
      const deptsRes = await apiGet<any>('/orgs/departments').catch(() => [])
      const orgRes = await apiGet<any>('/orgs/current').catch(() => null)
      
      const userList = Array.isArray(usersRes) ? usersRes : Array.isArray(usersRes?.data) ? usersRes.data : []
      const deptList = Array.isArray(deptsRes) ? deptsRes : Array.isArray(deptsRes?.data) ? deptsRes.data : []
      const orgData = orgRes?.data ? orgRes.data : orgRes
      
      setUsers(userList)
      setDepartments(deptList)
      setCurrentOrg(orgData?.id ? orgData : null)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeamData()
  }, [fetchTeamData])

  const inviteMember = async (email: string, departmentId?: string) => {
    try {
      const res = await apiPost<any>('/orgs/invite', {
        email,
        department_id: departmentId || null,
      })
      await fetchTeamData()
      return { success: true, data: res?.data }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to invite member' }
    }
  }

  const createDepartment = async (name: string, description?: string) => {
    try {
      const res = await apiPost<any>('/orgs/departments', { name, description })
      await fetchTeamData()
      return { success: true, data: res?.data }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create department' }
    }
  }

  const assignDepartment = async (userId: string, departmentId: string | null) => {
    try {
      await apiPatch<any>(`/users/${userId}/department`, { department_id: departmentId })
      await fetchTeamData()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to assign department' }
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const { apiDelete } = await import('@/lib/api/client')
      await apiDelete(`/users/${userId}`)
      await fetchTeamData()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete user' }
    }
  }

  return {
    users,
    departments,
    currentOrg,
    loading,
    error,
    inviteMember,
    createDepartment,
    assignDepartment,
    deleteUser,
    fetchTeamData,
  }
}
