'use client'

import { useState, useEffect } from 'react'
import { Joyride, STATUS, Step, TooltipRenderProps } from 'react-joyride'
import { CheckCircle2, ChevronRight, X, Compass, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

const TOUR_STEPS: Step[] = [
  {
    target: '#tour-get-started',
    content: 'Start here! Follow our step-by-step guide to verify your organization domain, deploy the extension, and configure DLP protection.',
    placement: 'right',
  },
  {
    target: '#tour-dashboard',
    content: 'Your real-time command center. Monitor protected prompts, sensitive data redactions, and team activity at a glance.',
    placement: 'right',
  },
  {
    target: '#tour-event-logs',
    content: 'Audit every prompt and detection. Inspect exactly which PII, API keys, or confidential files were intercepted.',
    placement: 'right',
  },
  {
    target: '#tour-policy',
    content: "Customize zero-trust data boundaries. Tune sensitivity thresholds or configure custom regex rules across your company.",
    placement: 'right',
  }
]

function CustomTooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-[var(--bg-surface)] border border-[var(--border-2)] shadow-2xl rounded-2xl w-80 max-w-sm overflow-hidden animate-scale-in"
      style={{
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-[var(--accent-light)] text-[var(--accent-text)] flex items-center justify-center font-bold text-xs">
            {index + 1}
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {index === 0 ? 'Welcome to SecureGPT' : 'Platform Walkthrough'}
          </h3>
        </div>
        <button
          {...closeProps}
          className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer"
          aria-label="Close Tour"
          title="Exit Tour"
        >
          <X size={15} />
        </button>
      </div>

      <div className="p-5 text-xs text-[var(--text-secondary)] leading-relaxed">
        {step.content}
      </div>

      <div className="flex items-center justify-between bg-[var(--bg-surface-2)] border-t border-[var(--border)] px-4 py-3">
        <button
          {...skipProps}
          className="text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          Exit Tour
        </button>

        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 cursor-pointer"
            style={{ background: isLastStep ? 'var(--success)' : 'var(--accent)' }}
          >
            <span>{isLastStep ? 'Complete' : 'Next'}</span>
            {isLastStep ? <CheckCircle2 size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export function OnboardingTour() {
  const { user } = useAuth()
  const [run, setRun] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const tourCompletedKey = user?.id ? `securegpt_tour_completed_${user.id}` : null
  const promptDismissedKey = user?.id ? `securegpt_tour_prompt_dismissed_${user.id}` : null

  // Check if first-time user should see the subtle bottom prompt
  useEffect(() => {
    if (!user || typeof window === 'undefined' || !tourCompletedKey || !promptDismissedKey) return

    const hasCompleted = localStorage.getItem(tourCompletedKey)
    const hasDismissedPrompt = localStorage.getItem(promptDismissedKey)

    if (!hasCompleted && !hasDismissedPrompt) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [user, tourCompletedKey, promptDismissedKey])

  // Listen for manual triggers from sidebar "Tour" button
  useEffect(() => {
    const handleStartTour = () => {
      setShowPrompt(false)
      setRun(true)
    }
    window.addEventListener('start-tour', handleStartTour)
    return () => window.removeEventListener('start-tour', handleStartTour)
  }, [])

  function handleAcceptPrompt() {
    setShowPrompt(false)
    if (promptDismissedKey) localStorage.setItem(promptDismissedKey, 'true')
    setRun(true)
  }

  function handleDismissPrompt() {
    setShowPrompt(false)
    if (promptDismissedKey) localStorage.setItem(promptDismissedKey, 'true')
    if (tourCompletedKey) localStorage.setItem(tourCompletedKey, 'true')
  }

  const handleJoyrideCallback = (data: any) => {
    const { status, action } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status) || action === 'close') {
      setRun(false)
      if (tourCompletedKey && typeof window !== 'undefined') {
        localStorage.setItem(tourCompletedKey, 'true')
      }
      if (promptDismissedKey && typeof window !== 'undefined') {
        localStorage.setItem(promptDismissedKey, 'true')
      }
    }
  }

  if (typeof window === 'undefined') return null

  return (
    <>
      {/* ── Subtle First-Time Bottom Prompt Banner ─────────────────────── */}
      {showPrompt && !run && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full animate-slide-up">
          <div
            className="p-4 rounded-2xl border shadow-xl flex items-start gap-3.5 relative"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-2)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)',
            }}
          >
            <div className="mt-0.5 size-8 rounded-xl bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] flex items-center justify-center shrink-0">
              <Compass size={18} />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                Take a quick platform tour?
              </h4>
              <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Learn the core telemetry views and enterprise DLP controls in under 1 minute.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleAcceptPrompt}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 flex items-center gap-1 cursor-pointer"
                  style={{ background: 'var(--accent)' }}
                >
                  <span>Start Tour</span>
                  <ArrowRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleDismissPrompt}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  No thanks
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissPrompt}
              className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Joyride Interactive Tooltips ──────────────────────────────── */}
      <Joyride
        onEvent={handleJoyrideCallback}
        continuous
        run={run}
        scrollToFirstStep
        steps={TOUR_STEPS}
        tooltipComponent={CustomTooltip}
        options={{
          skipBeacon: true,
          showProgress: true,
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.45)',
        }}
        styles={{
          tooltip: {
            padding: 0,
            background: 'transparent',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
        }}
      />
    </>
  )
}
