// packages\shared\src\types\auth.types.ts
// Auth Types
// Session-cookie based — no JWT, no tokens
// ─────────────────────────────────────────────

import type { UserRole } from '../constants/roles.constants'

// Core user shape — matches what /api/v1/auth/me returns
export interface User {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: UserRole
  orgId: string | null
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface Org {
  id: string
  name: string
  adminEmail: string
  plan: 'free' | 'pro' | 'enterprise'
  ssoEnabled: boolean
  ssoConfig?: SSOConfig
  createdAt: string
}

export interface SSOConfig {
  provider: 'okta' | 'azure_ad' | 'google_workspace'
  entryPoint: string
  issuer: string
  cert: string
}

export interface GoogleOAuthUser {
  googleId: string
  email: string
  name: string
  avatarUrl: string
}

// ─── Kept for any legacy references — not used in session-based auth ─────────
// @deprecated — backend uses httpOnly session cookies, not JWT
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}