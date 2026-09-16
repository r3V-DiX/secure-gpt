// src/types/index.ts
// All types mirror backend response shapes exactly (camelCase from API).

// ── Pagination ────────────────────────────────────────────────────────────────
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

// ── Auth / User ───────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'platform_super_admin' | 'org_admin' | 'security_admin' | 'auditor' | 'employee' | 'user'

export interface AuthUser {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: UserRole
    isActive: boolean
    orgId: string | null
    createdAt: string
    lastLoginAt: string | null
    deactivatedAt?: string | null
    deactivationReason?: string | null
    roles?: string[]
    permissions?: string[]
}

// ── Admin RBAC Types ──────────────────────────────────────────────────────────
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
    role: UserRole
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


// ── Audit Log ─────────────────────────────────────────────────────────────────
export type ActionType = 'BLOCK' | 'MASK' | 'WARN_ALLOW' | 'ALLOW'
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface AuditLog {
    id: string
    eventId: string | null
    userEmail: string | null
    actionTaken: ActionType
    categoryTriggered: string
    detectionType: string
    detectionTier: string
    llmPlatform: string
    domain: string | null
    matchCount: number
    entityTypes: string[]
    severities: SeverityLevel[]
    extensionVersion: string | null
    osPlatform: string | null
    browser: string | null
    acknowledged: boolean
    latencyMs: number | null
    timestamp: string
    receivedAt: string
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export interface DashboardStats {
    roleScope?: 'platform' | 'organization'
    totalEvents: number
    maskedCount: number
    allowedCount: number
    blockedCount: number
    cancelledCount: number
    topEntityTypes: { type: string; count: number }[]
    topDomains: { domain: string; count: number }[]
    eventsByDay: { date: string; count: number }[]
    topOrganizations?: { id: string; name: string; domain: string; plan: string; count: number; percent: number; color?: string }[]
    topEmployees?: { email: string; name: string; dept: string; count: number; role?: string; color?: string }[]
    topDepartments?: { name: string; count: number; percent: number; action: string; color?: string }[]
}

// ── Policy ────────────────────────────────────────────────────────────────────
export type PolicyAction = 'BLOCK' | 'MASK' | 'WARN_ALLOW' | 'ALLOW'

export interface CustomRule {
    id: string
    type: 'custom'
    label: string
    pattern: string
    caseSensitive?: boolean
    severity: 'low' | 'medium' | 'high' | 'critical'
    description?: string
    requireContext?: boolean
    triggers?: string[]
    maskingLabel?: string
    enabled: boolean
}

export interface RuleOverride {
    enabled?: boolean
    action?: PolicyAction
}

export interface CategoryConfig {
    enabled: boolean
    action: PolicyAction
    customKeywords: string[]
    allowlist: string[]
    fuzzyMatch: boolean
    customRules?: CustomRule[]
    ruleOverrides?: Record<string, RuleOverride>
}

export interface PIIConfig {
    version: number
    categories: Record<string, CategoryConfig>
    monitoredPlatforms: string[]
    customDomains: string[]
    allowPause: boolean
    logUserEmail: boolean
    sensitivityLevel: 'low' | 'medium' | 'high'
    updatedAt?: string
}

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

// ── Log Stats ─────────────────────────────────────────────────────────────────
export interface LogStats {
    totalEvents: number
    blockedCount: number
    maskedCount: number
    warnedCount: number
    allowedCount: number
    topEntityTypes: { type: string; count: number }[]
    topPlatforms: { platform: string; count: number }[]
    topDomains: { domain: string; count: number }[]
}