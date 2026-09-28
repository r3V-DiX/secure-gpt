'use client'
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { useAuth } from '@/contexts/auth-context';
import { useSystemVersion } from '@/contexts/system-version-context';
import {
  BarChart3,
  Globe,
  ArrowRight,
  EyeOff,
  Users,
  ShieldCheck,
  Search,
  Scan,
  Mail,
  ExternalLink,
  AtSign,
  Link2,
  Lock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileKey,
  Fingerprint,
  Network,
  History,
} from 'lucide-react';

import { PlatformIcon } from '@/components/shared/PlatformIcon';
import { LandingFooter, CHROME_STORE_URL } from '@/components/landing/LandingFooter';
import { PlatformCardGrid } from '@/components/landing/PlatformCardGrid';
import { ThreatCoverageSection, TrustSignalsSection } from '@/components/landing/ThreatAndTrustSections';
import { LandingHeroSection } from '@/components/landing/LandingHeroSection';
import { FeaturesSection, HowItWorksSection } from '@/components/landing/FeaturesAndHowItWorks';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { currentVersion } = useSystemVersion();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-poppins), Poppins, system-ui, sans-serif' }}>

      {/* ── Navigation ── */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md"
           style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <a href="#hero" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden"
                 style={{ background: 'var(--brand-dark)' }}>
              <img src="/rivedix_logo.png" alt="SecureGPT" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Secure<span style={{ color: 'var(--accent)' }}>GPT</span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>Features</a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>How it works</a>
            <a href="#platforms" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>Platforms</a>
            <a href="#threat-coverage" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>Coverage</a>
            <Link href="/versions" className="text-sm font-medium transition-colors flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              <span>Versions</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] font-semibold">
                v{currentVersion}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!loading && user ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-6">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex text-sm font-semibold">Sign In</Button>
                </Link>
                <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-full px-6 text-sm font-semibold"
                          style={{ boxShadow: '0 4px 14px var(--brand-btn-shadow)' }}>
                    Get Started Free
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ── Hero & Stat Strip ── */}
        <LandingHeroSection />

        {/* ── Features ── */}
        <FeaturesSection />

        {/* ── How It Works ── */}
        <HowItWorksSection />

        {/* ── Supported AI Platforms (17 Total) ── */}
        <section id="platforms" className="py-28 px-6 border-t"
                 style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border"
                   style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}>
                <Globe size={13} />
                Universal LLM Egress Protection
              </div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Zero-Config Coverage for 17+ AI Platforms
              </h2>
              <p className="max-w-2xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
                SecureGPT automatically hooks into web chat areas, prompt inputs, and drag-and-drop file upload zones across all industry standard generative AI tools.
              </p>
            </div>

            <PlatformCardGrid />
          </div>
        </section>

        {/* ── Threat coverage ── */}
        <ThreatCoverageSection />

        {/* ── Trust signals ── */}
        <TrustSignalsSection />

        {/* ── CTA ── */}
        <section className="py-28 px-6">
          <div className="max-w-5xl mx-auto rounded-lg p-12 md:p-20 text-center relative overflow-hidden text-white"
               style={{ background: 'linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-mid) 50%, var(--accent) 100%)' }}>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
                   style={{ background: 'var(--on-dark-faint)', borderColor: 'var(--on-dark-border)', color: 'var(--brand-link)' }}>
                <Shield size={11} />
                Your team is using AI right now
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
                Every unprotected prompt<br />is a potential breach.
              </h2>
              <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: 'var(--on-dark-body)' }}>
                SecureGPT takes 2 minutes to install and immediately starts protecting every message your team sends to AI tools — for free.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="lg"
                          className="rounded-full px-10 font-bold border-transparent"
                          style={{ background: 'var(--on-dark-full)', color: 'var(--brand-dark)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                    <Shield size={16} className="mr-2" style={{ color: 'var(--accent)' }} />
                    Add to Chrome — It's Free
                  </Button>
                </a>
                <a href="mailto:info@rivedix.com?subject=SecureGPT Enterprise"
                   className="text-sm font-semibold pb-0.5 transition-colors"
                   style={{ color: 'var(--brand-link)', borderBottom: '1px solid var(--on-dark-border)' }}>
                  Talk to our security team →
                </a>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.04] pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '36px 36px' }} />
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <LandingFooter currentVersion={currentVersion} />
    </div>
  );
}
