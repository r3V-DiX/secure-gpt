// ─────────────────────────────────────────────
// Auth Service — Extension
// Session-cookie based Google OAuth flow.
//
// IMPORTANT: All auth calls go through the DASHBOARD proxy (localhost:3000)
// NOT directly to the backend (localhost:8000).
// This ensures the session cookie is set on localhost:3000 — the same origin
// as the dashboard — so both share the same session.
// ─────────────────────────────────────────────

import axios from 'axios'
import { authStorage, stateStorage, localStorageExt } from '@/lib/storage/storage'
import { API_ENDPOINTS } from '@/config/api.config'
import type { User } from '@securegpt/shared/types'

// Dashboard URL — all auth flows go through here, NOT the backend directly
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL ?? 'https://securegpt.rkavach.com'

// Separate axios client that targets the dashboard proxy
const dashboardClient = axios.create({
  baseURL: DASHBOARD_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Extension-Request': 'true',
  },
  timeout: 10000,
})

// ── Fetch current user from session ──────────
// Goes through dashboard proxy so the cookie on localhost:3000 is sent.
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const response = await dashboardClient.get<{ success: boolean; data: User }>(
      API_ENDPOINTS.AUTH_ME
    )
    const user = response.data.data
    await authStorage.setAuth({ user })
    // Ensure device is registered with the backend for real-time pairing status
    void registerDevice()
    return user
  } catch {
    await authStorage.clearAuth()
    return null
  }
}

// ── Open Google OAuth in a new tab ────────────
// Goes through dashboard (/api/v1/auth/google) NOT backend directly.
// This way the cookie is set on localhost:3000, shared with the dashboard.
export async function signInWithGoogle(): Promise<void> {
  await chrome.tabs.create({ url: `${DASHBOARD_URL}/api/v1/auth/google` })
}

// ── Sign in with test email (Dev only) ─────────
export async function signInWithEmail(email: string): Promise<User | null> {
  try {
    await dashboardClient.post('/api/v1/auth/dev-login', { email })
    const user = await fetchCurrentUser()
    if (user) {
      chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', user }).catch(() => {})
      try {
        const tabs = await chrome.tabs.query({})
        for (const t of tabs) {
          if (t.id) {
            chrome.tabs.sendMessage(t.id, { type: 'AUTH_SUCCESS' }).catch(() => {})
          }
        }
      } catch {
        // ignore
      }
    }
    return user
  } catch (err) {
    console.error('[SecureGPT] Email bypass login failed:', err)
    throw err
  }
}


// ── Sign out ──────────────────────────────────
// Goes through dashboard proxy so the correct cookie is cleared.
export async function signOut(): Promise<void> {
  try {
    await dashboardClient.post(API_ENDPOINTS.AUTH_LOGOUT)
  } catch {
    // Even if backend call fails, clear local state
  } finally {
    await authStorage.clearAuth()
    await stateStorage.resetSessionStats()
    // Broadcast auth lost to popup and all active tabs
    chrome.runtime.sendMessage({ type: 'AUTH_LOST' }).catch(() => {})
    try {
      const tabs = await chrome.tabs.query({})
      for (const t of tabs) {
        if (t.id) {
          chrome.tabs.sendMessage(t.id, { type: 'AUTH_LOST' }).catch(() => {})
        }
      }
    } catch {
      // ignore
    }
  }
}

// ── Check if user is logged in ────────────────
export async function isAuthenticated(): Promise<boolean> {
  return authStorage.isLoggedIn()
}

// ── Get locally cached user ───────────────────
export async function getCurrentUser(): Promise<User | null> {
  return authStorage.getUser()
}

// ── Register device with backend ──────────────
export async function registerDevice(): Promise<string | null> {
  try {
    const loggedIn = await authStorage.isLoggedIn()
    if (!loggedIn) {
      return null
    }

    const cachedDeviceId = await localStorageExt.get<string>('deviceId')
    const payload = {
      name: `${getBrowserName()} Extension`,
      hostname: null,
      osPlatform: navigator.platform,
      browser: getBrowserName(),
      extensionVersion: chrome.runtime.getManifest().version,
    }

    if (cachedDeviceId) {
      try {
        await dashboardClient.patch(
          API_ENDPOINTS.DEVICE_HEARTBEAT(cachedDeviceId),
          payload
        )
        return cachedDeviceId
      } catch {
        // If device was deleted or not found, proceed to re-register
      }
    }

    const response = await dashboardClient.post<{
      success: boolean
      data: { id: string }
    }>(API_ENDPOINTS.DEVICE_REGISTER, payload)

    const newDeviceId = response.data?.data?.id
    if (newDeviceId) {
      await localStorageExt.set('deviceId', newDeviceId)
    }
    return newDeviceId
  } catch (err) {
    console.warn('[SecureGPT] Device registration failed:', err)
    return null
  }
}

export async function sendDeviceHeartbeat(): Promise<void> {
  const loggedIn = await authStorage.isLoggedIn()
  if (!loggedIn) {
    return
  }

  const cachedDeviceId = await localStorageExt.get<string>('deviceId')
  if (!cachedDeviceId) {
    void registerDevice()
    return
  }

  try {
    await dashboardClient.patch(
      API_ENDPOINTS.DEVICE_HEARTBEAT(cachedDeviceId),
      {
        name: `${getBrowserName()} Extension`,
        osPlatform: navigator.platform,
        browser: getBrowserName(),
        extensionVersion: chrome.runtime.getManifest().version,
      }
    )
  } catch (err: unknown) {
    // If heartbeat fails because device was deleted (404) or unauthenticated (401),
    // clear local device state and sign out the extension
    const axiosErr = err as { response?: { status?: number } }
    if (axiosErr.response?.status === 404 || axiosErr.response?.status === 401) {
      await localStorageExt.remove('deviceId')
      await signOut()
    }
  }
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  return 'Chrome'
}