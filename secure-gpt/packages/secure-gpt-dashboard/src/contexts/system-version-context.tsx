'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import apiClient from '@/lib/api/client'
import {
  TabKey,
  VersionItem,
  BASELINE_VERSIONS,
  ADMIN_VERSIONS,
  EXTENSION_VERSIONS,
} from '@/config/versions.data'

const getVersion = (version: VersionItem[]) => 
  version[0]?.version ?? 'Not Available'

export interface SystemVersionContextType {
  currentVersion: string
  adminVersion: string
  extensionVersion: string
  releases: Record<TabKey, VersionItem[]>
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const SystemVersionContext = createContext<SystemVersionContextType>({
  currentVersion: getVersion(BASELINE_VERSIONS),
  adminVersion: getVersion(ADMIN_VERSIONS),
  extensionVersion: getVersion(EXTENSION_VERSIONS),
  releases: {
    baseline: BASELINE_VERSIONS,
    admin: ADMIN_VERSIONS,
    extension: EXTENSION_VERSIONS,
  },
  loading: false,
  error: null,
  refresh: async () => {},
})

export function SystemVersionProvider({ children }: { children: React.ReactNode }) {
  const [currentVersion, setCurrentVersion] = useState<string>(getVersion(BASELINE_VERSIONS))
  const [adminVersion, setAdminVersion] = useState<string>(getVersion(ADMIN_VERSIONS))
  const [extensionVersion, setExtensionVersion] = useState<string>(getVersion(EXTENSION_VERSIONS))
  const [releases, setReleases] = useState<Record<TabKey, VersionItem[]>>({
    baseline: BASELINE_VERSIONS,
    admin: ADMIN_VERSIONS,
    extension: EXTENSION_VERSIONS,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReleases = useCallback(async () => {
    try {
      const res = await apiClient.get<{
        status: string
        currentVersion: string
        components: {
          baseline: string
          admin: string
          extension: string
        }
        releases: Record<TabKey, VersionItem[]>
      }>('/system/releases')

      if (res.data && res.data.releases) {
        setReleases({
          baseline: res.data.releases.baseline?.length ? res.data.releases.baseline : BASELINE_VERSIONS,
          admin: res.data.releases.admin?.length ? res.data.releases.admin : ADMIN_VERSIONS,
          extension: res.data.releases.extension?.length ? res.data.releases.extension : EXTENSION_VERSIONS,
        })
        if (res.data.components) {
          if (res.data.components.baseline) setCurrentVersion(res.data.components.baseline)
          if (res.data.components.admin) setAdminVersion(res.data.components.admin)
          if (res.data.components.extension) setExtensionVersion(res.data.components.extension)
        } else if (res.data.currentVersion) {
          setCurrentVersion(res.data.currentVersion)
        }
        setError(null)
      }
    } catch (err: any) {
      // Fallback silently to static seed data
      setError(err?.message ?? 'Failed to sync live releases')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchReleases()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchReleases])

  return (
    <SystemVersionContext.Provider
      value={{
        currentVersion,
        adminVersion,
        extensionVersion,
        releases,
        loading,
        error,
        refresh: fetchReleases,
      }}
    >
      {children}
    </SystemVersionContext.Provider>
  )
}

export function useSystemVersion() {
  return useContext(SystemVersionContext)
}
