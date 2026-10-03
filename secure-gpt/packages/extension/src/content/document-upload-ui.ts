import type { DocumentPhase } from '@securegpt/shared/types'

export interface UploadDisplay {
  id: string
  file: File
  phase: DocumentPhase
  detail?: string | undefined
  retryable: boolean
}

const messages: Record<DocumentPhase, string> = {
  queued: 'Checking document… Waiting for the scanner.',
  checking: 'Checking document… Upload held.',
  'awaiting-warning': 'Sensitive information found. Acknowledge before uploading.',
  redacting: 'Sensitive information found—upload blocked while redacting.',
  attaching: 'Attaching approved document…',
  completed: 'Document checked and attached.',
  failed: 'Upload blocked. The document could not be safely processed.',
  cancelled: 'Upload removed.',
}

export function renderDocumentUploads(jobs: UploadDisplay[], actions: { retry(id: string): void; remove(id: string): void; acknowledge(id: string): void }): void {
  let host = document.getElementById('securegpt-document-uploads')
  if (!jobs.length) { host?.remove(); return }
  if (!host) {
    host = document.createElement('div')
    host.id = 'securegpt-document-uploads'
    host.attachShadow({ mode: 'open' })
    ;(document.body ?? document.documentElement).appendChild(host)
  }
  const root = host.shadowRoot!
  root.replaceChildren()
  const style = document.createElement('style')
  style.textContent = `:host{position:fixed;right:20px;bottom:100px;z-index:2147483647;width:min(420px,calc(100vw - 32px));font:14px/1.5 system-ui;color:#172033}section{background:#fff;border:1px solid #64748b;border-radius:10px;box-shadow:0 4px 20px #0003;max-height:45vh;overflow:auto}article{padding:12px 16px;border-bottom:1px solid #ddd}article:last-child{border:0}strong{display:block;overflow-wrap:anywhere}p{margin:5px 0}button{font:inherit;border:1px solid #64748b;background:#f8fafc;color:#172033;border-radius:5px;padding:4px 10px;margin:4px 8px 0 0;cursor:pointer}button:focus-visible{outline:3px solid #2563eb}article[data-phase=failed],article[data-phase=redacting]{border-left:4px solid #b91c1c}@media(prefers-color-scheme:dark){section{background:#172033;color:#f8fafc}button{background:#263348;color:#fff}}`
  const section = document.createElement('section')
  section.setAttribute('aria-label', 'SecureGPT document uploads')
  section.setAttribute('aria-live', 'polite')
  for (const job of jobs) {
    const row = document.createElement('article')
    row.dataset.phase = job.phase
    const title = document.createElement('strong')
    title.textContent = job.file.name
    const status = document.createElement('p')
    status.textContent = job.detail ?? messages[job.phase]
    row.append(title, status)
    const button = (label: string, callback: () => void) => {
      const element = document.createElement('button')
      element.type = 'button'
      element.textContent = label
      element.addEventListener('click', callback)
      row.append(element)
    }
    if (job.phase === 'failed' && job.retryable) button('Retry', () => actions.retry(job.id))
    if (job.phase === 'awaiting-warning') button('Acknowledge & upload', () => actions.acknowledge(job.id))
    button(job.phase === 'completed' ? 'Dismiss' : 'Remove', () => actions.remove(job.id))
    section.append(row)
  }
  root.append(style, section)
}
