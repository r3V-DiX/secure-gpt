import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from './profile/page'
import SettingsPage from './settings/page'

vi.mock('@/contexts/toast-context', () => ({
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}))

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1', orgId: 'org-1', fullName: 'Example User', email: 'user@example.com',
      avatarUrl: null, role: 'org_admin', isActive: true, createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: null,
    },
    logout: vi.fn(),
  }),
}))

vi.mock('@/contexts/system-version-context', () => ({
  useSystemVersion: () => ({ currentVersion: '1.2.3' }),
}))

vi.mock('@/components/ui/modal/modal', () => ({
  Modal: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div>{children}</div> : null,
  useDangerConfirm: () => vi.fn(async () => false),
  useLogoutConfirm: () => vi.fn(async () => false),
}))

vi.mock('@/features/profile/components/registered-devices-panel', () => ({
  RegisteredDevicesPanel: () => <div>Device list</div>,
}))

afterEach(cleanup)

describe('profile and settings page layout', () => {
  it('presents profile details and directs account actions to settings', () => {
    render(<ProfilePage />)

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Identity' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Account details' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Identity' }).querySelector('.card')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Account details' }).querySelector('.card')).toBeInTheDocument()
    expect(screen.getByText('user-1')).toBeVisible()
    expect(screen.getByRole('link', { name: /Open settings/ })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: /Open settings/ })).toHaveClass('focus-visible:ring-2')
    expect(screen.queryByRole('button', { name: /Delete account/i })).not.toBeInTheDocument()
  })

  it('gives device controls room and keeps account actions in settings', () => {
    render(<SettingsPage />)

    const heading = screen.getByRole('heading', { name: 'Settings' })
    const devices = screen.getByRole('region', { name: 'Registered devices' })
    expect(heading.closest('header')).not.toContainElement(devices)
    expect(devices).toHaveClass('lg:col-span-7')
    expect(devices.querySelector('.card')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Authentication' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Data export' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View profile/ })).toHaveClass('focus-visible:ring-2')
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeInTheDocument()
  })
})
