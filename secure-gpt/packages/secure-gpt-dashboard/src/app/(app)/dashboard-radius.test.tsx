import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppLayout from './layout'

const route = vi.hoisted(() => ({ pathname: '/profile' }))

vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}))
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { role: 'org_admin', orgId: 'org-1' },
    loading: false,
    sessionExpired: false,
    dismissExpired: vi.fn(),
  }),
}))
vi.mock('@/components/layout/Sidebar', () => ({ Sidebar: () => null }))
vi.mock('@/components/layout/TopNav', () => ({ TopNav: () => null }))
vi.mock('@/components/layout/OnboardingTour', () => ({ OnboardingTour: () => null }))
vi.mock('@/components/error/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/ui/modal/modal', () => ({ Modal: () => null }))

afterEach(() => {
  cleanup()
  route.pathname = '/profile'
})

describe('dashboard radius scope', () => {
  it('applies compact corners outside Policy, including the body used by dialogs', async () => {
    const page = () => <AppLayout><p>Dashboard content</p></AppLayout>
    const { rerender, unmount } = render(page())

    await waitFor(() => expect(document.body).toHaveAttribute('data-dashboard-radius', 'compact'))

    route.pathname = '/policy'
    rerender(page())
    await waitFor(() => expect(document.body).not.toHaveAttribute('data-dashboard-radius'))

    route.pathname = '/settings'
    rerender(page())
    await waitFor(() => expect(document.body).toHaveAttribute('data-dashboard-radius', 'compact'))

    unmount()
    expect(document.body).not.toHaveAttribute('data-dashboard-radius')
  })
})
