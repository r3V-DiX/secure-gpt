'use client'
// src/features/profile/hooks/use-profile.ts
import { useState, useEffect } from 'react'
import { fetchMyDevices } from '../services/profile.service'
import { useAuth } from '@/contexts/auth-context'
import type { Device } from '@/types'

export function useProfile() {
  const { user, loading: authLoading } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyDevices()
      .then(setDevices)
      .catch((e: Error) => setError(e.message))
      .finally(() => setDevicesLoading(false))
  }, [])

  return { user, devices, loading: authLoading || devicesLoading, error }
}