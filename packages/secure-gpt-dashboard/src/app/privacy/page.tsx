'use client'
// packages/secure-gpt-dashboard/src/app/privacy/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { useAuth } from '@/contexts/auth-context';

export default function PrivacyPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Navigation */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ background: 'var(--accent)' }}>S</div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>SecureGPT</span>
          </Link>
          <div className="flex items-center gap-4">
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
        <article className="max-w-3xl mx-auto p-8 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
          
          <div className="space-y-8" style={{ color: 'var(--text-secondary)' }}>
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>1. Introduction</h2>
              <p>SecureGPT ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our browser extension and dashboard.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>2. Data Collection and Processing</h2>
              <p>SecureGPT is designed with a "privacy-first" architecture. Most data processing occurs locally within your browser:</p>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                <li><strong>Local Redaction:</strong> Sensitive data (PII, credentials, etc.) is detected and masked locally. Raw sensitive data never leaves your browser.</li>
                <li><strong>Metadata Logging:</strong> We collect anonymized metadata about blocked events (e.g., "Email detected and masked") to provide audit logs to your enterprise administrator.</li>
                <li><strong>Account Information:</strong> We store basic information required for account management, such as your work email and organization name.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>3. Use of Information</h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                <li>Provide and maintain the SecureGPT service.</li>
                <li>Generate compliance reports and audit logs for your organization.</li>
                <li>Improve our detection algorithms (using anonymized patterns).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>4. Security</h2>
              <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>5. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at privacy@securegpt.io.</p>
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
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            © 2026 SecureGPT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}