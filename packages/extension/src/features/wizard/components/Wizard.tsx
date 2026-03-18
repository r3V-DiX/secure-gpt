// ─────────────────────────────────────────────
// Wizard — 7-Step Onboarding
// ─────────────────────────────────────────────

import React, { useState } from 'react'
import { syncStorage } from '@/lib/storage/storage'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'
import { Step1Welcome } from './steps/Step1Welcome'
import { Step2OrgSetup } from './steps/Step2OrgSetup'
import { Step3Categories } from './steps/Step3Categories'
import { Step4Actions } from './steps/Step4Actions'
import { Step5Platforms } from './steps/Step5Platforms'
import { Step6Review } from './steps/Step6Review'
import { Step7Done } from './steps/Step7Done'
import { clsx } from 'clsx'
import type { PIIConfig } from '@securegpt/shared/types'

const STEPS = [
  'Welcome', 'Organisation', 'Categories', 'Actions', 'Platforms', 'Review', 'Done'
]

export function Wizard() {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<PIIConfig>(DEFAULT_EXTENSION_CONFIG)
  const [orgName, setOrgName] = useState('')

  function next() { setStep((s) => Math.min(s + 1, 7)) }
  function back() { setStep((s) => Math.max(s - 1, 1)) }

  async function finish() {
    await syncStorage.set('wizardCompleted', true)
    await syncStorage.set('policy', config)
    await syncStorage.set('policyVersion', 1)
    setStep(7)
  }

  async function skip() {
    await syncStorage.set('wizardCompleted', true)
    window.close()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6" style={{ fontFamily: 'var(--sg-font)' }}>
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        {step < 7 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-700">Step {step} of 6</span>
              <button
                onClick={skip}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip setup →
              </button>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex-1 h-1.5 rounded-full transition-all duration-300',
                    i + 1 < step ? 'bg-blue-600' :
                    i + 1 === step ? 'bg-blue-400' :
                    'bg-blue-100'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
          {step === 1 && <Step1Welcome onNext={next} onSkip={skip} />}
          {step === 2 && <Step2OrgSetup onNext={next} onBack={back} orgName={orgName} setOrgName={setOrgName} />}
          {step === 3 && <Step3Categories onNext={next} onBack={back} config={config} setConfig={setConfig} />}
          {step === 4 && <Step4Actions onNext={next} onBack={back} config={config} setConfig={setConfig} />}
          {step === 5 && <Step5Platforms onNext={next} onBack={back} config={config} setConfig={setConfig} />}
          {step === 6 && <Step6Review onFinish={finish} onBack={back} config={config} orgName={orgName} />}
          {step === 7 && <Step7Done />}
        </div>
      </div>
    </div>
  )
}
