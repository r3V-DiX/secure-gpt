// ─────────────────────────────────────────────
// RBAC Roles
// ─────────────────────────────────────────────

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SECURITY_ADMIN: 'SECURITY_ADMIN',
  AUDITOR: 'AUDITOR',
  HR_MANAGER: 'HR_MANAGER',
  USER: 'USER',
} as const

export type UserRole = keyof typeof USER_ROLES

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  SECURITY_ADMIN: 'Security Admin',
  AUDITOR: 'Auditor',
  HR_MANAGER: 'HR / Manager',
  USER: 'User',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Full access: policy, users, reports, devices, billing.',
  SECURITY_ADMIN: 'Read/write on policies and reports. Cannot manage users or billing.',
  AUDITOR: 'Read-only access to all logs and reports.',
  HR_MANAGER: 'Summary reports for their department only. No individual raw logs.',
  USER: 'Extension user. Sees only own activity.',
}

// Permissions map — what each role can do
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'policy:read', 'policy:write',
    'users:read', 'users:write',
    'logs:read',
    'devices:read', 'devices:write',
    'reports:read', 'reports:generate',
    'billing:read', 'billing:write',
    'orgs:read', 'orgs:write',
    'alerts:read', 'alerts:write',
  ],
  SECURITY_ADMIN: [
    'policy:read', 'policy:write',
    'users:read',
    'logs:read',
    'devices:read',
    'reports:read', 'reports:generate',
    'alerts:read', 'alerts:write',
  ],
  AUDITOR: [
    'logs:read',
    'reports:read',
    'alerts:read',
  ],
  HR_MANAGER: [
    'logs:read:department',
    'reports:read:department',
  ],
  USER: [
    'logs:read:own',
  ],
}
