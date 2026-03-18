'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchUsers, type UsersResponse } from '../services/users.service'
import type { User } from '@securegpt/shared/types'

export function useUsers() {
  const [data, setData] = useState<User[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true)
    try {
      const res = await fetchUsers({ page: p, limit: 50, search: s || undefined })
      setData(res.data)
      setPagination(res.pagination)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(page, search) }, [page, search, load])

  function handleSearch(q: string) { setSearch(q); setPage(1) }

  return { data, pagination, loading, search, page, setPage, handleSearch, reload: () => load(page, search) }
}
