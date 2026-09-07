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

  const refreshDevices = async () => {
    try {
      const list = await fetchMyDevices()
      setDevices(list)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDevicesLoading(false)
    }
  }

  const removeDevice = async (deviceId: string) => {
    const { deleteDevice } = await import('../services/profile.service')
    await deleteDevice(deviceId)
    setDevices(prev => prev.filter(d => d.id !== deviceId))
  }

  useEffect(() => {
    if (user) {
      void refreshDevices()
    } else {
      setDevices([])
      setDevicesLoading(false)
    }
  }, [user?.id])

  return { user, devices, loading: authLoading || devicesLoading, error, refreshDevices, removeDevice }
}