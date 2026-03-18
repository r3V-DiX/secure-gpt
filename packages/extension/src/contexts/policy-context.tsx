// ─────────────────────────────────────────────
// Policy Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect } from 'react'
import { policyStorage } from '@/lib/storage/storage'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'
import type { PIIConfig } from '@securegpt/shared/types'

interface PolicyContextValue {
  policy: PIIConfig
  loading: boolean
  reload: () => Promise<void>
}

const PolicyContext = createContext<PolicyContextValue>({
  policy: DEFAULT_EXTENSION_CONFIG,
  loading: true,
  reload: async () => {},
})

export function PolicyProvider({ children }: { children: React.ReactNode }) {
  const [policy, setPolicy] = useState<PIIConfig>(DEFAULT_EXTENSION_CONFIG)
  const [loading, setLoading] = useState(true)

  async function reload() {
    const stored = await policyStorage.getPolicy()
    setPolicy(stored ?? DEFAULT_EXTENSION_CONFIG)
    setLoading(false)
  }

  useEffect(() => {
    void reload()

    // Listen for policy updates from background
    const handler = (message: { type: string; policy?: PIIConfig }) => {
      if (message.type === 'POLICY_UPDATED' && message.policy) {
        setPolicy(message.policy)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  return (
    <PolicyContext.Provider value={{ policy, loading, reload }}>
      {children}
    </PolicyContext.Provider>
  )
}

export function usePolicyContext() {
  return useContext(PolicyContext)
}
