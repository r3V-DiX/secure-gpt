import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import DedicatedVersionsPage from './page'

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

vi.mock('@/contexts/system-version-context', () => ({
  useSystemVersion: () => ({
    currentVersion: '1.1.5',
    adminVersion: '1.1.5',
    extensionVersion: '1.2.3',
    releases: { baseline: [], admin: [], extension: [] },
    loading: false,
  }),
}))

describe('DedicatedVersionsPage', () => {
  it('lets version descriptions fit inside each tier selector button', () => {
    render(<DedicatedVersionsPage />)

    const baseline = screen.getByRole('button', { name: /Baseline Product/ })
    expect(baseline).toHaveAttribute('aria-pressed', 'true')
    expect(baseline).toHaveClass('h-auto', 'min-h-28', 'items-stretch')
    expect(baseline).not.toHaveClass('h-8')
    expect(baseline).toContainElement(screen.getByText(/Core backend, API gateway/))
  })
})
