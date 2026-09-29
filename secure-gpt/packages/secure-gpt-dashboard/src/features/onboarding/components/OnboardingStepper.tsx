'use client'

import { Button } from '@/components/ui'
import React from 'react'
import { Check } from 'lucide-react'
import { clsx } from 'clsx'
import { ONBOARDING_STEPS, type OnboardingStep } from '../config/org-onboarding.data'

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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ONBOARDING_STEPS.map((step, idx) => {
        const isDone = idx < currentStepIndex || (idx === 1 && domainVerified)
        const isCurrent = idx === currentStepIndex
        const Icon = step.icon

        return (
          <Button variant="secondary"
            key={step.id}
            type="button"
            onClick={() => onSelectStep(idx)}
            className={clsx(
              'card flex items-center gap-3 p-3.5 text-left transition-all duration-200 cursor-pointer',
              isCurrent && 'ring-2 ring-[var(--accent)] bg-[var(--accent-light)]'
            )}
            style={{ borderColor: isCurrent
                ? 'var(--accent-border)'
                : isDone
                ? 'var(--success-border)'
                : 'var(--border)' }}
          >
            <div
              className="size-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-colors"
              style={{
                background: isCurrent
                  ? 'var(--accent)'
                  : isDone
                  ? 'var(--success)'
                  : 'var(--bg-surface-2)',
                color: isCurrent || isDone ? '#ffffff' : 'var(--text-tertiary)',
              }}
            >
              {isDone ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Step {step.stepNumber}
                </span>
                {isDone && (
                  <span className="text-[10px] font-bold text-[var(--success)]">✓ Done</span>
                )}
              </div>
              <h4 className="text-xs font-bold truncate text-[var(--text-primary)]">
                {step.title}
              </h4>
            </div>
          </Button>
        )
      })}
    </div>
  )
}
