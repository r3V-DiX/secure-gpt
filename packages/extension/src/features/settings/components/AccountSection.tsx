// ─────────────────────────────────────────────
// Account Section
// User profile + extension info
// ─────────────────────────────────────────────

import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card/card'
import { Button } from '@/components/ui/button/button'
import { Badge } from '@/components/ui/badge/badge'
import { ROLE_LABELS } from '@securegpt/shared/constants'
import { signOut } from '@/features/auth/services/auth.service'
import type { User } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import type { UserRole } from '@securegpt/shared/constants'

interface AccountSectionProps {
  user: User | null
  config: PIIConfig
}

export function AccountSection({ user, config }: AccountSectionProps) {
  async function handleSignOut() {
    await signOut()
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Account</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Your profile, organisation details and extension information.
        </p>
      </div>

      {/* Profile */}
      {user && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border border-gray-100" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="mt-1">
                <Badge variant="info">
                  {ROLE_LABELS[user.role as UserRole] ?? user.role}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Policy info */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Policy</CardTitle>
        </CardHeader>
        <div className="space-y-2 text-sm">
          <InfoRow label="Policy version" value={`v${config.version}`} />
          <InfoRow
            label="Last synced"
            value={config.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'Never'}
          />
          <InfoRow
            label="Sensitivity level"
            value={config.sensitivityLevel.charAt(0).toUpperCase() + config.sensitivityLevel.slice(1)}
          />
        </div>
      </Card>

      {/* Extension info */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Extension</CardTitle>
        </CardHeader>
        <div className="space-y-2 text-sm">
          <InfoRow label="Version" value={chrome.runtime.getManifest().version} />
          <InfoRow label="Browser" value={navigator.userAgent.includes('Edg/') ? 'Microsoft Edge' : 'Chrome'} />
          <InfoRow label="Platform" value={navigator.platform} />
        </div>
      </Card>

      {/* Danger zone */}
      <Card padding="md" className="border-red-100">
        <CardHeader>
          <CardTitle className="text-red-600">Sign out</CardTitle>
        </CardHeader>
        <p className="text-xs text-gray-500 mb-3">
          Signing out will disable protection until you sign back in.
        </p>
        <Button variant="danger" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
