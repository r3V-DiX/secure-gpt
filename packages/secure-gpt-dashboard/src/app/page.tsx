'use client'
// packages/secure-gpt-dashboard/src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { useAuth } from '@/contexts/auth-context';

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Navigation */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ background: 'var(--accent)' }}>S</div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>SecureGPT</span>
          </div>
          <div className="flex items-center gap-4">
            {!loading && user ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/login?tab=register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6" 
                 style={{ background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
              Enterprise Data Loss Prevention for AI
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8" style={{ color: 'var(--text-primary)' }}>
              Secure Your AI Interactions <br />
              <span style={{ color: 'var(--accent)' }}>Without Losing Productivity</span>
            </h1>
            <p className="text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
              SecureGPT intercepts sensitive data like PII, credentials, and secrets in your browser before they ever reach LLM providers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?tab=register">
                <Button size="lg" className="w-full sm:w-auto">Start Protecting Data</Button>
              </Link>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">Book a Demo</Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 border-t" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="size-12 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Real-time Detection</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Multi-tier detection using Regex, NER, and OCR to catch sensitive data as you type.</p>
              </div>
              <div>
                <div className="size-12 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Local Masking</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Data is masked locally in your browser. Raw sensitive information never leaves your machine.</p>
              </div>
              <div>
                <div className="size-12 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Audit Logging</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Full visibility into blocked events and risk patterns for enterprise compliance teams.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded flex items-center justify-center font-bold text-white text-xs" style={{ background: 'var(--accent)' }}>S</div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>SecureGPT</span>
          </div>
          <div className="flex items-center gap-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Contact</Link>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            © 2026 SecureGPT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}