// ─────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────

import type { UserRole } from '../constants/roles.constants'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: UserRole
  orgId: string
  department?: string
  isActive: boolean
  createdAt: string
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

export interface JWTPayload {
  sub: string           // user id
  email: string
  role: UserRole
  orgId: string
  iat: number
  exp: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface GoogleOAuthUser {
  googleId: string
  email: string
  name: string
  avatarUrl: string
}
