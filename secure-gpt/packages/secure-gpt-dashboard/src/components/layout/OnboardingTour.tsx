'use client'

import { useState, useEffect, useMemo } from 'react'
import { Joyride, STATUS, TooltipRenderProps } from 'react-joyride'
import { CheckCircle2, ChevronRight, X, Compass, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getTourStepsForRole, resolveTourRole, type TourRole } from '@/features/onboarding/config/tour.data'

const IS_ADMIN_MODE = process.env.NEXT_PUBLIC_APP_MODE === 'admin'

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
      className="bg-[var(--bg-surface)] border border-[var(--border-2)] shadow-2xl rounded-md w-80 max-w-sm overflow-hidden animate-scale-in"
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

  const activeRole: TourRole = useMemo(() => resolveTourRole(user, IS_ADMIN_MODE), [user])
  const steps = useMemo(() => getTourStepsForRole(activeRole), [activeRole])

  const tourCompletedKey = user?.id ? `securegpt_tour_completed_${activeRole}_${user.id}` : null
  const promptDismissedKey = user?.id ? `securegpt_tour_prompt_dismissed_${activeRole}_${user.id}` : null

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
            className="p-4 rounded-md border shadow-xl flex items-start gap-3.5 relative"
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
                {activeRole === 'super_admin'
                  ? 'Take a Super Admin Console Tour?'
                  : activeRole === 'org_admin'
                  ? 'Take an Enterprise Setup Tour?'
                  : activeRole === 'employee'
                  ? 'Take a Quick Employee Tour?'
                  : 'Take a Quick Platform Tour?'}
              </h4>
              <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                {activeRole === 'super_admin'
                  ? 'Learn how to inspect tenants, configure global permissions, and audit platform streams.'
                  : activeRole === 'org_admin'
                  ? 'Learn the core telemetry views, team provisioning, and enterprise DLP controls in under 1 minute.'
                  : activeRole === 'employee'
                  ? 'Learn how SecureGPT protects your AI prompts and view your company’s compliance status.'
                  : 'Learn how to install the extension, mask sensitive data, and configure privacy rules in under 1 minute.'}
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
        steps={steps}
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
