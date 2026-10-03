import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentScheduler } from '../../src/background/document-scheduler'

afterEach(() => { vi.useRealTimers() })
describe('document deadline', () => {
  it('cancels a hung operation after the shared processing budget', async () => {
    vi.useFakeTimers()
    const scheduler = new DocumentScheduler()
    const budget = scheduler.createBudget()
    const run = scheduler.run(budget, () => new Promise(() => undefined))
    const assertion = expect(run).rejects.toThrow('DOCUMENT_TIMEOUT')
    await vi.advanceTimersByTimeAsync(120_001)
    await assertion
    expect(budget.controller.signal.aborted).toBe(true)
  })
  it('does not spend a queued file’s budget while another file is running', async () => {
    vi.useFakeTimers()
    const scheduler = new DocumentScheduler()
    const first = scheduler.createBudget()
    const second = scheduler.createBudget()
    let finish!: () => void
    const one = scheduler.run(first, () => new Promise<void>(resolve => { finish = resolve }))
    const two = scheduler.run(second, async () => 'safe')
    await vi.advanceTimersByTimeAsync(100_000)
    expect(second.remainingMs).toBe(120_000)
    finish()
    await one
    await expect(two).resolves.toBe('safe')
    expect(second.remainingMs).toBeGreaterThan(119_000)
  })
  it('never runs cancelled queued work', async () => {
    const scheduler = new DocumentScheduler()
    const budget = scheduler.createBudget()
    budget.controller.abort()
    const work = vi.fn()
    await expect(scheduler.run(budget, work)).rejects.toBeDefined()
    expect(work).not.toHaveBeenCalled()
  })
})
