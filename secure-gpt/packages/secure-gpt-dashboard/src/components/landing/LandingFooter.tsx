'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, Link2, AtSign, ExternalLink } from 'lucide-react'

export const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/securegpt-%E2%80%94-llm-data-prot/cbhlhbhhlcfilggkmcmodmfaeongmbmo'

interface LandingFooterProps {
  currentVersion: string
}

export function LandingFooter({ currentVersion }: LandingFooterProps) {
  return (
    <footer className="py-16 border-t" style={{ background: 'var(--brand-dark)', borderColor: 'var(--brand-mid)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'var(--on-dark-logo)' }}>
                <img src="/rivedix_logo.png" alt="SecureGPT" className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="text-lg font-bold" style={{ color: 'var(--on-dark-full)' }}>
                Secure<span style={{ color: 'var(--brand-light)' }}>GPT</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{ color: 'var(--on-dark-mid)' }}>
              Browser-native DLP for AI — built by{' '}
              <a href="https://rivedix.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-link)' }}>
                Rivedix
              </a>.
            </p>
            <a href="mailto:info@rivedix.com" className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--on-dark-muted)' }}>
              <Mail size={12} /> info@rivedix.com
            </a>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--on-dark-high)' }}>Product</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--on-dark-muted)' }}>
              <li><a href="#features" style={{ color: 'inherit' }}>Features</a></li>
              <li><a href="#how-it-works" style={{ color: 'inherit' }}>How it works</a></li>
              <li><a href="#platforms" style={{ color: 'inherit' }}>Supported Platforms (17)</a></li>
              <li><a href="#threat-coverage" style={{ color: 'inherit' }}>Threat coverage</a></li>
              <li><Link href="/versions" style={{ color: 'var(--brand-light)' }}>Version History (v{currentVersion})</Link></li>
              <li><a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-light)' }}>Chrome Extension ↗</a></li>
              <li><Link href="/dashboard" style={{ color: 'inherit' }}>Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--on-dark-high)' }}>Company</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--on-dark-muted)' }}>
              <li><a href="https://rivedix.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>About Rivedix</a></li>
              <li><a href="mailto:info@rivedix.com?subject=SecureGPT Enterprise" style={{ color: 'inherit' }}>Enterprise Sales</a></li>
              <li><a href="mailto:info@rivedix.com" style={{ color: 'inherit' }}>Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--on-dark-high)' }}>Legal</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--on-dark-muted)' }}>
              <li><Link href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={{ color: 'inherit' }}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-5" style={{ borderColor: 'var(--brand-mid)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--on-dark-low)' }}>
            © {new Date().getFullYear()} Rivedix. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="https://github.com/rivedix" target="_blank" rel="noopener noreferrer" aria-label="GitHub" style={{ color: 'var(--on-dark-low)' }}>
              <Link2 size={17} />
            </a>
            <a href="https://twitter.com/rivedix" target="_blank" rel="noopener noreferrer" aria-label="Twitter" style={{ color: 'var(--on-dark-low)' }}>
              <AtSign size={17} />
            </a>
            <a href="https://linkedin.com/company/rivedix" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: 'var(--on-dark-low)' }}>
              <ExternalLink size={17} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
