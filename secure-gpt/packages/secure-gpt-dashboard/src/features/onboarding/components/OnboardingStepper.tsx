'use client'

import { Button } from '@/components/ui'
import { Check } from 'lucide-react'
import { clsx } from 'clsx'
import { ONBOARDING_STEPS } from '../config/org-onboarding.data'

interface OnboardingStepperProps {
  currentStepIndex: number
  domainVerified?: boolean
  onSelectStep: (index: number) => void
}

export function OnboardingStepper({
  currentStepIndex,
  domainVerified = false,
  onSelectStep,
}: OnboardingStepperProps) {
  return (
    <nav aria-label="Enterprise setup progress">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ONBOARDING_STEPS.map((step, idx) => {
        const isDone = idx < currentStepIndex || (idx === 1 && domainVerified)
        const isCurrent = idx === currentStepIndex
        const Icon = step.icon

        return (
          <li key={step.id} className="min-w-0">
            <Button
              variant="secondary"
              type="button"
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => onSelectStep(idx)}
              className={clsx(
                'h-auto min-h-20 w-full justify-start gap-3 border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-left shadow-none',
                isCurrent && 'border-[var(--accent-border)] bg-[var(--accent-light)] ring-1 ring-[var(--accent)]',
                isDone && !isCurrent && 'border-[var(--success-border)]'
              )}
            >
              <span className={clsx(
                'flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
                isCurrent && 'bg-[var(--accent)] text-[var(--on-dark-full)]',
                isDone && !isCurrent && 'bg-[var(--success)] text-[var(--on-dark-full)]'
              )}>
                {isDone ? <Check size={17} aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  Step {step.stepNumber}{isDone ? ' · Complete' : ''}
                </span>
                <span className="mt-0.5 block whitespace-normal text-sm font-semibold leading-5 text-[var(--text-primary)]">
                  {step.title}
                </span>
              </span>
            </Button>
          </li>
        )
      })}
      </ol>
    </nav>
  )
}
