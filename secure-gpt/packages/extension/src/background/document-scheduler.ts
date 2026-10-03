import { DOCUMENT_PROCESSING_MS } from '@securegpt/shared/types'

export interface DocumentBudget {
  remainingMs: number
  controller: AbortController
}

/** Queue wait and user acknowledgement never consume a file's processing budget. */
export class DocumentScheduler {
  private queue: Promise<unknown> = Promise.resolve()

  createBudget(): DocumentBudget {
    return { remainingMs: DOCUMENT_PROCESSING_MS, controller: new AbortController() }
  }

  run<T>(budget: DocumentBudget, work: () => Promise<T>): Promise<T> {
    const operation = this.queue.then(async () => {
      const { signal } = budget.controller
      if (budget.remainingMs <= 0) { budget.controller.abort('DOCUMENT_TIMEOUT'); throw new Error('DOCUMENT_TIMEOUT') }
      signal.throwIfAborted()
      const start = performance.now()
      let abort: () => void = () => undefined
      const stopped = new Promise<never>((_, reject) => {
        abort = () => reject(new Error(signal.reason === 'DOCUMENT_TIMEOUT' ? 'DOCUMENT_TIMEOUT' : 'DOCUMENT_CANCELLED'))
        signal.addEventListener('abort', abort, { once: true })
      })
      const timer = setTimeout(() => budget.controller.abort('DOCUMENT_TIMEOUT'), Math.max(0, budget.remainingMs))
      try {
        return await Promise.race([work(), stopped])
      } finally {
        clearTimeout(timer)
        signal.removeEventListener('abort', abort)
        budget.remainingMs -= performance.now() - start
      }
    })
    this.queue = operation.catch(() => undefined)
    return operation
  }
}
