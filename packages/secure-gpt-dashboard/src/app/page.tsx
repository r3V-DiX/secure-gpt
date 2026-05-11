'use client'
// packages/secure-gpt-dashboard/src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { useAuth } from '@/contexts/auth-context';
import { 
  Shield, 
  Lock, 
  Zap, 
  BarChart3, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  EyeOff, 
  Users,
  ShieldCheck,
  Search,
  Scan
} from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col selection:bg-[var(--accent-light)] selection:text-[var(--accent-text)]" style={{ background: 'var(--bg-base)' }}>
      {/* Navigation */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={{ background: '#091a2a' }}>
              <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">SecureGPT</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="mr-1" />
            {!loading && user ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-6">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button className="rounded-full px-6 shadow-md shadow-indigo-500/20">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-24 pb-32 px-6 overflow-hidden">
          {/* Background Decor */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40" aria-hidden="true">
            <div className="absolute top-[-10%] left-[10%] size-[500px] rounded-full blur-[120px] bg-indigo-200/50" />
            <div className="absolute bottom-[-10%] right-[10%] size-[400px] rounded-full blur-[100px] bg-blue-100/50" />
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 shadow-sm border" 
                 style={{ background: 'var(--bg-surface)', color: 'var(--accent-text)', borderColor: 'var(--accent-border)' }}>
              <Zap size={12} className="fill-current" />
              <span>v1.0 is now live for enterprise</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8 text-[var(--text-primary)] leading-[1.1]">
              Secure Your AI Interactions <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">Without Friction</span>
            </h1>
            
            <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed text-[var(--text-secondary)]">
              SecureGPT is the enterprise-grade DLP that intercepts sensitive data like PII, credentials, and secrets in your browser before they ever reach LLM providers.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 shadow-xl shadow-indigo-500/25 group">
                  Start Protecting Now
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full px-8 h-12">
                Book Enterprise Demo
              </Button>
            </div>

            {/* Trusted By - Logo Placeholders */}
            <div className="mt-24">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-10">Trusted by modern security teams</p>
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60">
                {[
                  { name: 'Example Corp', icon: <Shield size={16} /> },
                  { name: 'Example Inc', icon: <Globe size={16} /> },
                  { name: 'Example Tech', icon: <Zap size={16} /> },
                  { name: 'Example AI', icon: <Users size={16} /> },
                  { name: 'Example Safe', icon: <Lock size={16} /> }
                ].map(logo => (
                  <div key={logo.name} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)]/50 transition-all hover:opacity-100 grayscale hover:grayscale-0">
                    <span className="text-[var(--text-secondary)]">{logo.icon}</span>
                    <span className="text-lg font-bold tracking-tighter text-[var(--text-primary)]">{logo.name}</span>
                    {/* TODO: Replace with actual logo image: <img src={`/logos/${logo.name.toLowerCase()}.svg`} alt={logo.name} className="h-6" /> */}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 border-t border-[var(--border)]" style={{ background: 'var(--bg-surface)' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Powerful Data Protection</h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Multiple layers of security designed to catch leaks before they happen, while keeping your team productive.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Search className="text-indigo-500" />}
                title="Real-time Inspection"
                desc="Our engine analyzes prompts as you type, using advanced Regex and NER to identify over 50+ types of sensitive data."
              />
              <FeatureCard 
                icon={<EyeOff className="text-emerald-500" />}
                title="Local-first Masking"
                desc="Data is redacted right in your browser. Raw PII never hits our servers, ensuring maximum privacy and compliance."
              />
              <FeatureCard 
                icon={<Scan className="text-blue-500" />}
                title="OCR Analysis"
                desc="We don't just scan text. SecureGPT analyzes images and file uploads to prevent data leaks in non-textual formats."
              />
              <FeatureCard 
                icon={<BarChart3 className="text-amber-500" />}
                title="Compliance Auditing"
                desc="Get detailed visibility into risk patterns across your organization with our comprehensive audit log and analytics."
              />
              <FeatureCard 
                icon={<Globe className="text-purple-500" />}
                title="Broad Compatibility"
                desc="SecureGPT works seamlessly with ChatGPT, Gemini, Claude, Copilot, and custom internal LLM applications."
              />
              <FeatureCard 
                icon={<Users className="text-rose-500" />}
                title="Role-based Policies"
                desc="Configure granular detection policies tailored to different departments and security requirements."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-32 px-6 border-t border-[var(--border)]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-8 leading-tight" style={{ color: 'var(--text-primary)' }}>
                  How SecureGPT <br /> Keeps You Safe
                </h2>
                <div className="space-y-8">
                  <Step 
                    number="01" 
                    title="Intercept" 
                    desc="SecureGPT's browser extension hooks into LLM input fields, catching the prompt before the user clicks send." 
                  />
                  <Step 
                    number="02" 
                    title="Detect" 
                    desc="Local analysis tiers (Regex, NER, OCR) identify sensitive entities without sending raw data to the cloud." 
                  />
                  <Step 
                    number="03" 
                    title="Protect" 
                    desc="Based on your policy, data is either masked with a placeholder or the request is blocked entirely with a warning." 
                  />
                </div>
              </div>
              <div className="relative">
                <div className="rounded-3xl border shadow-2xl overflow-hidden bg-[var(--bg-surface)] p-2">
                   {/* Mock UI Representation */}
                   <div className="bg-[var(--bg-surface-2)] rounded-2xl p-6 aspect-square flex flex-col gap-4 border border-[var(--border)]">
                      <div className="h-4 w-1/3 rounded" style={{ background: 'var(--accent-light)' }} />
                      <div className="h-12 w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--border-2)] p-4 text-xs font-mono text-[var(--text-secondary)]">
                        Here is my API key: <span className="px-1 rounded border underline" style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'var(--danger-border)', textDecorationColor: 'var(--danger)' }}>sk-proj-7a...</span>
                      </div>
                      <div className="flex justify-end">
                        <div className="h-8 w-24 rounded-lg flex items-center justify-center text-[10px] text-white font-bold" style={{ background: 'var(--danger)' }}>BLOCKING...</div>
                      </div>
                      <div className="mt-4 p-4 rounded-xl border flex gap-3" style={{ background: 'var(--danger-light)', borderColor: 'var(--danger-border)' }}>
                         <ShieldCheck className="shrink-0" size={20} style={{ color: 'var(--danger)' }} />
                         <div>
                            <p className="text-xs font-bold" style={{ color: 'var(--danger)' }}>Sensitive Data Detected</p>
                            <p className="text-[10px] mt-1" style={{ color: 'var(--danger)', opacity: 0.8 }}>Found: OpenAI API Key. This action has been blocked per company policy.</p>
                         </div>
                      </div>
                   </div>
                   {/* Background Glow */}
                   <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-full blur-3xl opacity-20 bg-indigo-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden text-white" 
               style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Ready to Secure Your AI Future?</h2>
              <p className="text-xl text-indigo-100/70 max-w-2xl mx-auto mb-12">
                Join hundreds of enterprises using SecureGPT to enable AI adoption without compromising on security or privacy.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button variant="secondary" size="lg" className="rounded-full bg-white text-indigo-900 hover:bg-indigo-50 px-10 h-14 font-bold shadow-xl border-transparent">
                    Get Started for Free
                  </Button>
                </Link>
                <Link href="#">
                  <span className="text-sm font-bold border-b border-indigo-200/30 pb-0.5 hover:border-indigo-100 transition-colors">Talk to Sales</span>
                </Link>
              </div>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="size-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden" style={{ background: '#091a2a' }}>
                  <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-0.5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">SecureGPT</span>
              </div>              <p className="text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed">
                Empowering teams to use Generative AI safely with enterprise-grade data loss prevention built for the browser.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-6 text-[var(--text-primary)]">Product</h4>
              <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Extension</a></li>
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">API</a></li>
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Enterprise</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-6 text-[var(--text-primary)]">Company</h4>
              <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-6 text-[var(--text-primary)]">Legal</h4>
              <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
                <li><Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--accent)] transition-colors">Terms of Service</Link></li>
                <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-[var(--text-tertiary)] font-medium">
              © 2026 SecureGPT Inc. All rights reserved.
            </p>
            <div className="flex gap-6 text-[var(--text-tertiary)]">
               {/* Social Icons Placeholder */}
               <div className="size-5 bg-current opacity-20 rounded-full" />
               <div className="size-5 bg-current opacity-20 rounded-full" />
               <div className="size-5 bg-current opacity-20 rounded-full" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
      <div className="size-12 rounded-2xl flex items-center justify-center mb-6 bg-[var(--bg-surface-2)] group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="text-2xl font-black text-indigo-200/60 tabular-nums leading-none">{number}</div>
      <div>
        <h4 className="text-lg font-bold mb-2 text-[var(--text-primary)]">{title}</h4>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>
      </div>
    </div>
  );
}