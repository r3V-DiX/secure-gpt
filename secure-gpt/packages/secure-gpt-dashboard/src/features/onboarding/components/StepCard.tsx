'use client'

import React from 'react'
import { Circle, CircleCheck } from 'lucide-react'
import type { Step } from '@/features/onboarding/config/steps.data'
import { renderStepAction } from '@/features/onboarding/components/StepActionRenderer'

interface StepCardProps {
  step: Step
  index: number
  isDone: boolean
  isAutoVerified: boolean
  onToggle: (id: string) => void
}

export function StepCard({
  step,
  index,
  isDone,
  isAutoVerified,
  onToggle,
}: StepCardProps) {
  const Icon = step.icon

  return (
    <div
      className="card p-5 animate-fade-in"
      style={{
        animationDelay: `${index * 60}ms`,
        borderColor: isDone ? 'var(--success-border)' : undefined,
      }}
    >
      <div className="flex gap-4">
        {/* Step icon */}
        <div
          className="size-11 rounded-md flex items-center justify-center shrink-0 transition-colors duration-300"
          style={{
            background: isDone ? 'var(--success-light)' : 'var(--accent-light)',
            border: `1.5px solid ${isDone ? 'var(--success-border)' : 'var(--accent-border)'}`,
            color: isDone ? 'var(--success)' : 'var(--accent-text)',
          }}
        >
          <Icon size={19} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  <span className="mr-1.5 font-mono text-xs align-baseline" style={{ color: 'var(--text-tertiary)' }}>
                    {index + 1}.
                  </span>
                  {step.title}
                </h2>
                {isAutoVerified && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Live Auto-Detected
                  </span>
                )}
              </div>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {step.description}
              </p>
            </div>

            {/* Mark done toggle */}
            <button
              onClick={() => onToggle(step.id)}
              aria-pressed={isDone}
              aria-label={isDone ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all shrink-0 cursor-pointer hover:brightness-105"
              style={{
                background: isDone ? 'var(--success-light)' : 'var(--bg-surface-2)',
                borderColor: isDone ? 'var(--success-border)' : 'var(--border-2)',
                color: isDone ? 'var(--success)' : 'var(--text-tertiary)',
              }}
            >
              {isDone ? <CircleCheck size={13} /> : <Circle size={13} />}
              {isDone ? 'Done' : 'Mark done'}
            </button>
          </div>

          {/* Action CTA */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            {renderStepAction(step.id)}
          </div>
        </div>
      </div>
    </div>
  )
}
