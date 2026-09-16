// src/types/index.ts
// Re-export all shared types and declare dashboard-specific UI extensions

export * from '@securegpt/shared'

// ── Action & Severity aliases for dashboard compatibility ─────────────────────
export type ActionType = 'BLOCK' | 'MASK' | 'WARN_ALLOW' | 'ALLOW' | 'BLOCKED' | 'MASKED' | 'WARNED' | 'ALLOWED'
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'low' | 'medium' | 'high' | 'critical'

// ── Dashboard Pagination ──────────────────────────────────────────────────────
export interface Pagination {
  page: number
  page_size: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: Pagination
}

// ── Auth User Extension ───────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'platform_super_admin' | 'org_admin' | 'security_admin' | 'auditor' | 'employee' | 'user'

export interface Permission {
  id: string
  action: string
  module: 'USER' | 'POLICY' | 'SYSTEM' | 'AUDIT' | 'ROLE' | 'ORGANISATION'
  name: string
  description: string | null
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isActive: boolean
}

export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions: Permission[]
}

export interface AdminUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: UserRole | string
  isActive: boolean
  orgId: string | null
  createdAt: string
  lastLoginAt: string | null
  deactivatedAt?: string | null
  deactivationReason?: string | null
  roles: Role[]
}

export interface AdminAuditLog {
  id: string
  userId: string | null
  userEmail: string | null
  userName: string | null
  userRoles: string[] | null
  action: string
  module: 'USER' | 'POLICY' | 'SYSTEM' | 'AUDIT' | 'ROLE' | 'ORGANISATION'
  description: string | null
  entityId: string | null
  entityType: string | null
  entityName: string | null
  beforeState: Record<string, any> | null
  afterState: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  status: 'SUCCESS' | 'FAILED' | 'DENIED'
  reason: string | null
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: string
}

export interface SystemAuthLog {
  id: string
  userId: string | null
  userEmail: string
  userName: string
  eventType: string
  success: boolean
  userAgent: string | null
  fingerprintHash: string | null
  metadata: Record<string, any> | null
  createdAt: string
}

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: string
  isActive: boolean
  orgId: string | null
  departmentId?: string | null
  createdAt: string
  lastLoginAt: string | null
  deactivatedAt?: string | null
  deactivationReason?: string | null
  roles?: string[]
  permissions?: string[]
}

// ── Enterprise Organisation & Department ──────────────────────────────────────
export type OrgStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED'

export interface Organisation {
  id: string
  name: string
  domain: string | null
  admin_email: string
  status: OrgStatus
  dns_txt_token: string | null
  domain_verified_at: string | null
  created_at: string
}

export interface Department {
  id: string
  org_id: string
  name: string
  description: string | null
  created_at: string
  members_count?: number
}

// ── DLP Incident ──────────────────────────────────────────────────────────────
export interface DLPIncident {
  id: string
  org_id: string
  department_id: string | null
  user_id: string
  user_email: string
  policy_id: string
  policy_name: string
  target_app: string
  action_taken: 'BLOCK' | 'MASK' | 'WARN' | 'LOG_ONLY'
  severity: string
  redacted_snippet: string
  override_reason: string | null
  created_at: string
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export interface DashboardStats {
  roleScope?: string
  totalEvents: number
  blockedCount: number
  maskedCount: number
  warnedCount: number
  cancelledCount?: number
  allowedCount: number
  topEntityTypes: { type: string; count: number }[]
  topPlatforms?: { platform: string; count: number }[]
  topDomains: { domain: string; count: number }[]
  timeline?: { date: string; count: number }[]
  eventsByDay?: { date: string; count: number }[]
  topOrganizations?: { id: string; name: string; domain: string; plan: string; count: number; percent: number; color?: string }[]
  topEmployees?: { email: string; name: string; dept: string; count: number; role?: string; color?: string }[]
  topDepartments?: { name: string; count: number; percent: number; action: string; color?: string }[]
}

// ── AuditLog Override for Frontend ───────────────────────────────────────────
import type { PolicyAction, PIICategory, DetectionTier, PIIConfig } from '@securegpt/shared'

export interface EventLog {
  id?: string
  eventId: string
  timestamp: string
  receivedAt?: string
  actionTaken: PolicyAction
  categoryTriggered: PIICategory
  detectionType: string
  detectionTier: DetectionTier
  llmPlatform: string
  domain?: string
  matchCount: number
  snippetHash?: string
  entityTypes?: string[]
  severities?: string[]
  extensionVersion?: string
  osPlatform?: string
  browser?: string
  acknowledged?: boolean
  latencyMs?: number
  pipelineVersion?: string
}

export type AuditLog = EventLog

// ── Policy ────────────────────────────────────────────────────────────────────
export interface Policy {
  id: string | null
  userId: string
  config: PIIConfig
  version: number
  isActive: boolean
  publishedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

// ── Device ────────────────────────────────────────────────────────────────────
export interface Device {
  id: string
  userId: string | null
  name: string
  hostname: string | null
  osPlatform: string | null
  browser: string | null
  extensionVersion: string | null
  isActive: boolean
  createdAt: string
  lastSeenAt: string | null
}