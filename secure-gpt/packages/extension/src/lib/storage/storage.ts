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
    return localStorageExt.get('auth')
  },

  async setAuth(auth: StoredAuth): Promise<void> {
    return localStorageExt.set('auth', auth)
  },

  async clearAuth(): Promise<void> {
    return localStorageExt.remove('auth')
  },

  // Convenience — returns user or null
  async getUser(): Promise<User | null> {
    const auth = await localStorageExt.get<StoredAuth>('auth')
    return auth?.user ?? null
  },

  // Check if we have a cached user (doesn't verify session is still valid)
  async isLoggedIn(): Promise<boolean> {
    const auth = await localStorageExt.get('auth')
    return auth !== null
  },
}

// ── Policy helpers ────────────────────────────
export const policyStorage = {
  async getPolicy(): Promise<PIIConfig | null> {
    return localStorageExt.get('policy')
  },

  async setPolicy(policy: PIIConfig, version: number): Promise<void> {
    await localStorageExt.set('policy', policy)
    await localStorageExt.set('policyVersion', version)
    await localStorageExt.set('policyLastSyncedAt', new Date().toISOString())
  },

  async getPolicyVersion(): Promise<number> {
    return (await localStorageExt.get<number>('policyVersion')) ?? 0
  },
}

// ── Extension state helpers ───────────────────
export const stateStorage = {
  async isActive(): Promise<boolean> {
    const active = await localStorageExt.get<boolean>('isActive')
    if (active === null) return true // default to active

    const pausedUntil = await localStorageExt.get<string>('pausedUntil')
    if (pausedUntil) {
      if (new Date(pausedUntil) > new Date()) return false
      // Bug 4 fix: pause expired — clear it and restore active state so the
      // extension resumes automatically without requiring a manual Resume click.
      await localStorageExt.remove('pausedUntil')
      await localStorageExt.set('isActive', true)
      return true
    }

    return active
  },

  async setActive(active: boolean): Promise<void> {
    await localStorageExt.set('isActive', active)
    if (active) await localStorageExt.remove('pausedUntil')
  },

  async pauseFor(minutes: number): Promise<void> {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    await localStorageExt.set('pausedUntil', until)
    await localStorageExt.set('isActive', false)
  },

  async incrementStat(action: 'block' | 'mask' | 'warn'): Promise<void> {
    const keyMap = {
      block: 'sessionBlockCount',
      mask: 'sessionMaskCount',
      warn: 'sessionWarnCount',
    } as const
    const key = keyMap[action]
    const current = (await localStorageExt.get<number>(key)) ?? 0
    await localStorageExt.set(key, current + 1)
  },

  async getSessionStats() {
    return {
      blockCount: (await localStorageExt.get<number>('sessionBlockCount')) ?? 0,
      maskCount: (await localStorageExt.get<number>('sessionMaskCount')) ?? 0,
      warnCount: (await localStorageExt.get<number>('sessionWarnCount')) ?? 0,
    }
  },

  async setSessionStats(stats: { blockCount: number; maskCount: number; warnCount: number }): Promise<void> {
    await localStorageExt.set('sessionBlockCount', stats.blockCount)
    await localStorageExt.set('sessionMaskCount', stats.maskCount)
    await localStorageExt.set('sessionWarnCount', stats.warnCount)
  },

  async resetSessionStats(): Promise<void> {
    await localStorageExt.set('sessionBlockCount', 0)
    await localStorageExt.set('sessionMaskCount', 0)
    await localStorageExt.set('sessionWarnCount', 0)
  },
}