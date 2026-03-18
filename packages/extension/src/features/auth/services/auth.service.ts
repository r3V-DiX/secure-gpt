// ─────────────────────────────────────────────
// Auth Service — Extension
// Google OAuth flow + device enrollment
// ─────────────────────────────────────────────

import apiClient from '@/lib/api/client'
import { authStorage } from '@/lib/storage/storage'
import { API_ENDPOINTS } from '@/config/api.config'
import type { StoredAuth } from '@/lib/storage/storage'

export async function getGoogleAuthUrl(): Promise<string> {
  const response = await apiClient.get(API_ENDPOINTS.AUTH_GOOGLE_URL)
  return response.data.data.url as string
}

export async function signInWithGoogle(): Promise<void> {
  // Open Google OAuth in a new tab
  const url = await getGoogleAuthUrl()
  await chrome.tabs.create({ url })
}

export async function handleOAuthCallback(code: string): Promise<void> {
  // Exchange code for tokens
  const response = await apiClient.post(API_ENDPOINTS.AUTH_GOOGLE_CALLBACK, null, {
    params: { code },
  })

  const { user, tokens } = response.data.data as {
    user: StoredAuth['user']
    tokens: StoredAuth['tokens']
  }

  // Enroll device and get device token
  const deviceResponse = await apiClient.post(
    API_ENDPOINTS.DEVICE_ENROLL,
    {
      os_platform: navigator.platform,
      browser: getBrowserName(),
      extension_version: chrome.runtime.getManifest().version,
    },
    {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    }
  )

  const { device_id: deviceId, device_token: deviceToken } =
    deviceResponse.data.data as { device_id: string; device_token: string }

  // Store auth + device info
  await authStorage.setAuth({ user, tokens, deviceId, deviceToken })
}

export async function signOut(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT)
  await authStorage.clearAuth()
}

export async function isAuthenticated(): Promise<boolean> {
  const auth = await authStorage.getAuth()
  return auth !== null
}

export async function getCurrentUser() {
  const auth = await authStorage.getAuth()
  return auth?.user ?? null
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  return 'Chrome'
}
