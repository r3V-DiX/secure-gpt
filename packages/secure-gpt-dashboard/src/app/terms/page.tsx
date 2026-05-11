'use client'
// packages/secure-gpt-dashboard/src/app/terms/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export default function TermsPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Navigation */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={{ background: '#091a2a' }}>
              <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>SecureGPT</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {!loading && user ? (
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 py-16 px-6">
        <article className="max-w-3xl mx-auto p-8 md:p-12 rounded-2xl border animate-fade-in" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Terms and Conditions</h1>
          
          <div className="space-y-8" style={{ color: 'var(--text-secondary)' }}>
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>1. Acceptance of Terms</h2>
              <p>By accessing or using SecureGPT, you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, do not use our service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>2. Use of Service</h2>
              <p>SecureGPT provides a browser-based Data Loss Prevention (DLP) tool. You agree to use the service only for lawful purposes and in accordance with your organization's security policies.</p>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                <li>You are responsible for maintaining the security of your account.</li>
                <li>You must not attempt to circumvent any security features of the extension.</li>
                <li>You agree not to use the service to transmit any malicious software.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>3. Intellectual Property</h2>
              <p>The service and its original content, features, and functionality are and will remain the exclusive property of SecureGPT and its licensors.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>4. Limitation of Liability</h2>
              <p>SecureGPT shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>5. Changes to Terms</h2>
              <p>We reserve the right to modify or replace these terms at any time. We will provide notice of any significant changes via the dashboard or email.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>6. Contact</h2>
              <p>For questions about these terms, please contact us at legal@securegpt.io.</p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-6 mb-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            © 2026 SecureGPT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
