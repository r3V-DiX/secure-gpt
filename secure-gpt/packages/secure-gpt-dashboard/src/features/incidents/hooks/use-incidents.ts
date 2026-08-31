// packages/secure-gpt-dashboard/src/features/incidents/hooks/use-incidents.ts
import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '@/lib/api/client'
import { DLPIncident, PaginatedResult } from '@/types'

export function useIncidents(departmentId?: string, severity?: string) {
  const [incidents, setIncidents] = useState<DLPIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true)
      let url = '/incidents?limit=50'
      if (departmentId) url += `&department_id=${encodeURIComponent(departmentId)}`
      if (severity) url += `&severity=${encodeURIComponent(severity)}`

      const res = await apiGet<PaginatedResult<DLPIncident>>(url)
      setIncidents(Array.isArray(res.data) ? res.data : [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch incident audit log')
    } finally {
      setLoading(false)
    }
  }, [departmentId, severity])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  return { incidents, loading, error, fetchIncidents }
}
