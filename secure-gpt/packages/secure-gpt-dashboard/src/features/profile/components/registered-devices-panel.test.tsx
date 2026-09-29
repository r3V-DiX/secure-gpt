import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RegisteredDevicesPanel } from './registered-devices-panel'

const { fetchDevices, deleteDevice, confirmRemoval, success } = vi.hoisted(() => ({
  fetchDevices: vi.fn(),
  deleteDevice: vi.fn(),
  confirmRemoval: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@/lib/api/client', () => ({
  apiGetPaginated: fetchDevices,
  apiDelete: deleteDevice,
}))
vi.mock('@/components/ui/modal/modal', () => ({
  useDangerConfirm: () => confirmRemoval,
}))
vi.mock('@/contexts/toast-context', () => ({
  useToast: () => ({ toast: { success, error: vi.fn() } }),
}))

afterEach(cleanup)

describe('registered device controls', () => {
  it('allows removing an active registered device without calling it the current device', async () => {
    fetchDevices.mockResolvedValue({
      data: [{
        id: 'device-1', userId: 'user-1', name: 'Office laptop', hostname: null,
        osPlatform: 'Linux', browser: 'Chrome', extensionVersion: null,
        isActive: true, createdAt: '2026-01-01T00:00:00Z', lastSeenAt: null,
      }],
    })
    confirmRemoval.mockResolvedValue(true)
    deleteDevice.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<RegisteredDevicesPanel />)

    expect(await screen.findByText('Office laptop')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.queryByText('This device')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View activity log/ })).toHaveAttribute('href', '/event-logs')

    await user.click(screen.getByRole('button', { name: 'Remove Office laptop' }))
    await waitFor(() => expect(deleteDevice).toHaveBeenCalledWith('/devices/device-1'))
    expect(screen.queryByText('Office laptop')).not.toBeInTheDocument()
    expect(success).toHaveBeenCalledWith('Device removed')
  })

  it('shows a retryable error when devices cannot be loaded', async () => {
    fetchDevices.mockRejectedValueOnce(new Error('Device service unavailable'))

    render(<RegisteredDevicesPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Device service unavailable')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.queryByText('No devices registered')).not.toBeInTheDocument()
  })

  it('uses the shared empty state when there are no devices', async () => {
    fetchDevices.mockResolvedValueOnce({ data: [] })

    render(<RegisteredDevicesPanel />)

    expect(await screen.findByRole('heading', { name: 'No devices registered' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View activity log/ })).toHaveClass('focus-visible:ring-2')
  })
})
