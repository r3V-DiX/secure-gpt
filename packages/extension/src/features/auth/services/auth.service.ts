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
import { authStorage } from '@/lib/storage/storage'
import { API_ENDPOINTS } from '@/config/api.config'
import type { User } from '@securegpt/shared/types'

// Dashboard URL — all auth flows go through here, NOT the backend directly
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL ?? 'http://localhost:3000'

// Separate axios client that targets the dashboard proxy
const dashboardClient = axios.create({
  baseURL: DASHBOARD_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
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

// ── Sign out ──────────────────────────────────
// Goes through dashboard proxy so the correct cookie is cleared.
export async function signOut(): Promise<void> {
  try {
    await dashboardClient.post(API_ENDPOINTS.AUTH_LOGOUT)
  } catch {
    // Even if backend call fails, clear local state
  } finally {
    await authStorage.clearAuth()
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
    const response = await dashboardClient.post<{
      success: boolean
      data: { id: string }
    }>(API_ENDPOINTS.DEVICE_REGISTER, {
      name: `${getBrowserName()} Extension`,
      hostname: null,
      osPlatform: navigator.platform,
      browser: getBrowserName(),
      extensionVersion: chrome.runtime.getManifest().version,
    })
    return response.data.data.id
  } catch {
    console.warn('[SecureGPT] Device registration failed')
    return null
  }
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  return 'Chrome'
}