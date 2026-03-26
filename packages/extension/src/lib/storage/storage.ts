// packages\extension\src\lib\storage\storage.ts
// Chrome Storage Wrapper
// Session-cookie auth — StoredAuth stores only the user profile.
// No tokens, no deviceToken. Session lives in the httpOnly cookie.
// ─────────────────────────────────────────────

import type { PIIConfig } from '@securegpt/shared/types'
import type { User } from '@securegpt/shared/types'

// Only the user profile is stored — session cookie handled by browser automatically
export interface StoredAuth {
  user: User
}

export interface ExtensionStorageSchema {
  // Auth — just the user profile fetched from /auth/me
  auth: StoredAuth | null
  // Policy — synced from backend
  policy: PIIConfig | null
  policyVersion: number
  policyLastSyncedAt: string | null
  // Extension state
  isActive: boolean
  pausedUntil: string | null
  // Session stats
  sessionBlockCount: number
  sessionMaskCount: number
  sessionWarnCount: number
  // Onboarding
  wizardCompleted: boolean
  wizardStep: number
}

// ── Sync storage (synced across devices) ──────
export const syncStorage = {
  async get<K extends keyof ExtensionStorageSchema>(
    key: K
  ): Promise<ExtensionStorageSchema[K] | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(key, (result) => {
        resolve((result[key] as ExtensionStorageSchema[K]) ?? null)
      })
    })
  },

  async set<K extends keyof ExtensionStorageSchema>(
    key: K,
    value: ExtensionStorageSchema[K]
  ): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve)
    })
  },

  async remove(key: keyof ExtensionStorageSchema): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.remove(key, resolve)
    })
  },
}

// ── Local storage (device only, larger quota) ─
export const localStorageExt = {
  async get<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve((result[key] as T) ?? null)
      })
    })
  },

  async set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve)
    })
  },

  async remove(key: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve)
    })
  },
}

// ── Auth helpers ─────────────────────────────
export const authStorage = {
  async getAuth(): Promise<StoredAuth | null> {
    return syncStorage.get('auth')
  },

  async setAuth(auth: StoredAuth): Promise<void> {
    return syncStorage.set('auth', auth)
  },

  async clearAuth(): Promise<void> {
    return syncStorage.remove('auth')
  },

  // Convenience — returns user or null
  async getUser(): Promise<User | null> {
    const auth = await syncStorage.get('auth')
    return auth?.user ?? null
  },

  // Check if we have a cached user (doesn't verify session is still valid)
  async isLoggedIn(): Promise<boolean> {
    const auth = await syncStorage.get('auth')
    return auth !== null
  },
}

// ── Policy helpers ────────────────────────────
export const policyStorage = {
  async getPolicy(): Promise<PIIConfig | null> {
    return syncStorage.get('policy')
  },

  async setPolicy(policy: PIIConfig, version: number): Promise<void> {
    await syncStorage.set('policy', policy)
    await syncStorage.set('policyVersion', version)
    await syncStorage.set('policyLastSyncedAt', new Date().toISOString())
  },

  async getPolicyVersion(): Promise<number> {
    return (await syncStorage.get('policyVersion')) ?? 0
  },
}

// ── Extension state helpers ───────────────────
export const stateStorage = {
  async isActive(): Promise<boolean> {
    const active = await syncStorage.get('isActive')
    if (active === null) return true // default to active

    const pausedUntil = await syncStorage.get('pausedUntil')
    if (pausedUntil && new Date(pausedUntil) > new Date()) return false

    return active
  },

  async setActive(active: boolean): Promise<void> {
    await syncStorage.set('isActive', active)
    if (active) await syncStorage.remove('pausedUntil')
  },

  async pauseFor(minutes: number): Promise<void> {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    await syncStorage.set('pausedUntil', until)
    await syncStorage.set('isActive', false)
  },

  async incrementStat(action: 'block' | 'mask' | 'warn'): Promise<void> {
    const keyMap = {
      block: 'sessionBlockCount',
      mask: 'sessionMaskCount',
      warn: 'sessionWarnCount',
    } as const
    const key = keyMap[action]
    const current = (await syncStorage.get(key)) ?? 0
    await syncStorage.set(key, (current as number) + 1)
  },

  async getSessionStats() {
    return {
      blockCount: (await syncStorage.get('sessionBlockCount')) ?? 0,
      maskCount: (await syncStorage.get('sessionMaskCount')) ?? 0,
      warnCount: (await syncStorage.get('sessionWarnCount')) ?? 0,
    }
  },

  async resetSessionStats(): Promise<void> {
    await syncStorage.set('sessionBlockCount', 0)
    await syncStorage.set('sessionMaskCount', 0)
    await syncStorage.set('sessionWarnCount', 0)
  },
}