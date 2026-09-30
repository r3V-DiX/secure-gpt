import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import type { PIIConfig } from '@securegpt/shared/types'
import { Button } from '@/components/ui/button/button'
import { Card } from '@/components/ui/card/card'
import { Textarea } from '@/components/ui/textarea/textarea'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'
import { authStorage, policyStorage, stateStorage } from '@/lib/storage/storage'
import { isPlatformEnabled } from '../content/platform-routing'
import { handleSubmit } from '../content/submit-handler'

export function NewTab() {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const policyRef = useRef<PIIConfig>(DEFAULT_EXTENSION_CONFIG)
  const protectionActiveRef = useRef(false)
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Checking AI Mode protection…')

  const navigate = useCallback((aiMode: boolean) => {
    const input = inputRef.current
    const prompt = input?.value.trim()
    if (!prompt) {
      input?.focus()
      return
    }
    const url = new URL('https://www.google.com/search')
    url.searchParams.set('q', prompt)
    if (aiMode) url.searchParams.set('udm', '50')
    window.location.assign(url.href)
  }, [])

  const refreshProtection = useCallback(async (): Promise<boolean> => {
    const [loggedIn, active, storedPolicy] = await Promise.all([
      authStorage.isLoggedIn(), stateStorage.isActive(), policyStorage.getPolicy(),
    ])
    const policy = storedPolicy ?? DEFAULT_EXTENSION_CONFIG
    const protectedNow = loggedIn && active && isPlatformEnabled(policy, 'google-ai-mode')
    policyRef.current = policy
    protectionActiveRef.current = protectedNow
    setStatus(protectedNow
      ? 'AI Mode prompts are checked before they are sent.'
      : !loggedIn ? 'Sign in to SecureGPT to protect AI Mode prompts.'
        : !active ? 'SecureGPT is paused.' : 'AI Mode monitoring is off in your policy.')
    return protectedNow
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => document.documentElement.classList.toggle('dark', media.matches)
    updateTheme()
    media.addEventListener('change', updateTheme)

    const onStorageChanged = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && ['auth', 'policy', 'isActive', 'pausedUntil'].some(key => key in changes)) {
        void refreshProtection()
      }
    }
    chrome.storage.onChanged.addListener(onStorageChanged)
    void refreshProtection()
    return () => {
      media.removeEventListener('change', updateTheme)
      chrome.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [refreshProtection])

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(false)
  }

  const onAiMode = async () => {
    const input = inputRef.current
    if (!input?.value.trim() || busyRef.current) {
      input?.focus()
      return
    }
    if (!await refreshProtection()) {
      navigate(true)
      return
    }
    busyRef.current = true
    setBusy(true)
    try {
      await handleSubmit(input, {
        getCurrentPolicy: () => policyRef.current,
        getPreAllowedText: () => '',
        ocrCache: new Map(),
        getPendingCount: () => 0,
        isProtectionActive: () => protectionActiveRef.current,
        entryPlatform: 'google-ai-mode',
        resubmit: () => navigate(true),
      })
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.shiftKey || event.altKey || event.metaKey) return
    event.preventDefault()
    if (event.ctrlKey) void onAiMode()
    else event.currentTarget.form?.requestSubmit()
  }

  return (
    <main className="newtab-main">
      <div className="newtab-brand"><span className="newtab-mark" aria-hidden="true">S</span>SecureGPT</div>
      <h1>Search with confidence.</h1>
      <p className="newtab-intro">Check a prompt before sending it to Google AI Mode.</p>
      <form id="search-form" onSubmit={onSearch}>
        <Card padding="lg" className="newtab-card">
          <label htmlFor="prompt" className="newtab-label">What would you like to ask?</label>
          <Textarea ref={inputRef} id="prompt" rows={3} placeholder="Ask anything" aria-describedby="shortcut-hint" className="min-h-36" onKeyDown={onPromptKeyDown} />
          <p id="shortcut-hint" className="newtab-hint">Enter: Google Search · Ctrl+Enter: AI Mode · Shift+Enter: new line</p>
          <div className="newtab-actions">
            <Button type="submit" variant="secondary" size="lg">Google Search</Button>
            <Button type="button" id="ai-mode" variant="primary" size="lg" loading={busy} onClick={() => { void onAiMode() }}>AI Mode</Button>
          </div>
        </Card>
      </form>
      <p id="status" role="status" aria-live="polite" className="newtab-status">{status}</p>
    </main>
  )
}
