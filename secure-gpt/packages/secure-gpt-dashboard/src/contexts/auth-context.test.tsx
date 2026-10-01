import React from 'react'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './auth-context'

const apiGet = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api/client', () => ({ apiGet, apiPost: vi.fn() }))

function SessionState() {
  const { loading, sessionExpired, user } = useAuth()
  return <div>{loading ? 'loading' : user ? 'signed-in' : sessionExpired ? 'expired' : 'signed-out'}</div>
}

afterEach(() => {
  cleanup()
  apiGet.mockReset()
})

describe('auth session state', () => {
  it('treats an initial 401 as signed out rather than an expired active session', async () => {
    apiGet.mockImplementation(async () => {
      await Promise.resolve()
      window.dispatchEvent(new Event('session-expired'))
      throw new Error('Authentication required')
    })

    render(<AuthProvider><SessionState /></AuthProvider>)

    await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy())
  })

  it('reports expiry after a session was successfully authenticated', async () => {
    apiGet.mockResolvedValue({ id: 'admin-1', role: 'super_admin' })

    render(<AuthProvider><SessionState /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('signed-in')).toBeTruthy())

    act(() => window.dispatchEvent(new Event('session-expired')))

    expect(screen.getByText('expired')).toBeTruthy()
  })
})
