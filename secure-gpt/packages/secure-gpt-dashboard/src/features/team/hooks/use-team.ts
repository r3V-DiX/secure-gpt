// packages/secure-gpt-dashboard/src/features/team/hooks/use-team.ts
import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPatch } from '@/lib/api/client'
import { AuthUser, Department, Organisation, Pagination } from '@/types'

export interface TeamFilters {
  search?: string
  department_id?: string
  role?: string
  is_active?: boolean
  page: number
  page_size: number
}

export function useTeam() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organisation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<TeamFilters>({
    search: '',
    department_id: '',
    role: '',
    page: 1,
    page_size: 25,
  })

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 25,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  })

  const fetchTeamData = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(currentFilters.page))
      params.set('page_size', String(currentFilters.page_size))
      if (currentFilters.search) params.set('search', currentFilters.search)
      if (currentFilters.department_id) params.set('department_id', currentFilters.department_id)
      if (currentFilters.role) params.set('role', currentFilters.role)

      const [usersRes, deptsRes, orgRes] = await Promise.all([
        apiGet<any>(`/users?${params.toString()}`).catch(() => ({ data: [], pagination: null })),
        apiGet<any>('/orgs/departments').catch(() => []),
        apiGet<any>('/orgs/current').catch(() => null),
      ])

      const userList = Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []
      const deptList = Array.isArray(deptsRes?.data) ? deptsRes.data : Array.isArray(deptsRes) ? deptsRes : []
      const orgData = orgRes?.data ? orgRes.data : orgRes

      setUsers(userList)
      setDepartments(deptList)
      setCurrentOrg(orgData?.id ? orgData : null)

      if (usersRes?.pagination) {
        setPagination(usersRes.pagination)
      } else {
        setPagination({
          page: currentFilters.page,
          page_size: currentFilters.page_size,
          total: userList.length,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        })
      }
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team data')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTeamData(filters)
  }, [filters, fetchTeamData])

  const updateFilters = useCallback((partial: Partial<TeamFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...partial,
      page: partial.page !== undefined ? partial.page : 1, // reset to page 1 on filter change unless page explicitly changed
    }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((page_size: number) => {
    setFilters(prev => ({ ...prev, page_size, page: 1 }))
  }, [])

  const inviteMember = async (email: string, departmentId?: string) => {
    try {
      const res = await apiPost<any>('/orgs/invite', {
        email,
        department_id: departmentId || null,
      })
      await fetchTeamData(filters)
      return { success: true, data: res?.data }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to invite member' }
    }
  }

  const createDepartment = async (name: string, description?: string) => {
    try {
      const res = await apiPost<any>('/orgs/departments', { name, description })
      await fetchTeamData(filters)
      return { success: true, data: res?.data }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create department' }
    }
  }

  const assignDepartment = async (userId: string, departmentId: string | null) => {
    try {
      await apiPatch<any>(`/users/${userId}/department`, { department_id: departmentId })
      await fetchTeamData(filters)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to assign department' }
    }
  }

  const changeUserRole = async (userId: string, role: string) => {
    try {
      await apiPatch<any>(`/users/${userId}/role`, { role })
      await fetchTeamData(filters)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update role' }
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const { apiDelete } = await import('@/lib/api/client')
      await apiDelete(`/users/${userId}`)
      await fetchTeamData(filters)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete user' }
    }
  }

  const executeBulkAction = async (
    userIds: string[],
    action: 'assign_department' | 'change_role' | 'deactivate' | 'activate' | 'delete',
    extra?: { department_id?: string; role?: string }
  ) => {
    try {
      const res = await apiPost<any>('/users/bulk', {
        user_ids: userIds,
        action,
        department_id: extra?.department_id,
        role: extra?.role,
      })
      await fetchTeamData(filters)
      return { success: true, data: res?.data }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to execute bulk action' }
    }
  }

  const exportCsv = () => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.department_id) params.set('department_id', filters.department_id)
    if (filters.role) params.set('role', filters.role)
    window.location.href = `/api/v1/users/export-csv?${params.toString()}`
  }

  return {
    users,
    departments,
    currentOrg,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    setPage,
    setPageSize,
    inviteMember,
    createDepartment,
    assignDepartment,
    changeUserRole,
    deleteUser,
    executeBulkAction,
    exportCsv,
    fetchTeamData,
  }
}
