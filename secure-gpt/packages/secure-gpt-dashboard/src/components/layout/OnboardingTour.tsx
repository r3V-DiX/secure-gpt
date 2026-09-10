'use client'

import { useState, useEffect } from 'react'
import { Joyride, STATUS, Step, TooltipRenderProps } from 'react-joyride'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'

const TOUR_STEPS: Step[] = [
  {
    target: '#tour-get-started',
    content: 'Start here! Follow our step-by-step guide to install the extension and connect your account securely.',
    placement: 'right',
  },
  {
    target: '#tour-dashboard',
    content: 'Once connected, your dashboard will display real-time statistics of protected and blocked data.',
    placement: 'right',
  },
  {
    target: '#tour-event-logs',
    content: 'Audit every prompt and detection. See exactly what sensitive data was blocked or masked before it reached the AI.',
    placement: 'right',
  },
  {
    target: '#tour-policy',
    content: "Customize your protection. Set up rules for PII, financial data, and add custom keywords to match your team's needs.",
    placement: 'right',
  }
]

function Tooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl rounded-2xl w-80 max-w-sm overflow-hidden"
    >
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
          {index === 0 ? 'Welcome to SecureGPT' : 'Interactive Tour'}
        </h3>
        <button
          {...closeProps}
          className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
          aria-label="Close Tour"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        {step.content}
      </div>

      <div className="flex items-center justify-between bg-[var(--bg-surface-2)] border-t border-[var(--border)] px-5 py-3">
        <div className="text-xs font-semibold text-[var(--text-tertiary)]">
          {index + 1} of {TOUR_STEPS.length}
        </div>
        <div className="flex gap-2">
          {!isLastStep && (
            <button
              {...skipProps}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] transition-colors cursor-pointer"
            >
              Skip
            </button>
          )}
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-[0_2px_8px_var(--accent-glow)] transition-transform hover:scale-105 cursor-pointer"
            style={{ background: isLastStep ? 'var(--success)' : 'var(--accent)' }}
          >
            {isLastStep ? 'Finish' : 'Next'}
            {isLastStep ? <CheckCircle2 size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useAuth } from '@/contexts/auth-context'

export function OnboardingTour() {
  const { user } = useAuth()
  const [run, setRun] = useState(false)

  useEffect(() => {
    // Automatically trigger tour for new user / account if not completed yet
    if (user && typeof window !== 'undefined') {
      const tourKey = `securegpt_tour_completed_${user.id}`
      const hasCompleted = localStorage.getItem(tourKey)
      if (!hasCompleted) {
        // Small delay to ensure DOM and target elements are fully mounted
        const timer = setTimeout(() => {
          setRun(true)
        }, 800)
        return () => clearTimeout(timer)
      }
    }
  }, [user])

  useEffect(() => {
    // Manually triggered tour based on user preference
    const handleStartTour = () => setRun(true)
    window.addEventListener('start-tour', handleStartTour)
    return () => window.removeEventListener('start-tour', handleStartTour)
  }, [])

  const handleJoyrideCallback = (data: any) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      if (user && typeof window !== 'undefined') {
        localStorage.setItem(`securegpt_tour_completed_${user.id}`, 'true')
      }
    }
  }

  // Ensure window is defined (SSR prevention)
  if (typeof window === 'undefined') return null;

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={TOUR_STEPS}
      tooltipComponent={Tooltip}

      options={{
        skipBeacon: true,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        zIndex: 10000,
        overlayColor: 'rgba(0, 0, 0, 0.45)',
      }}
      styles={{
        // @ts-expect-error Options is incorrectly typed or we are passing unsupported fields
        options: {
          arrowColor: 'var(--bg-surface)',
          backgroundColor: 'transparent',
        },
        tooltip: {
          padding: 0,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
      }}
    />
  )
}
