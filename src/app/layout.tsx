import type { Metadata } from 'next';
import { Shield, Lock, ExternalLink, Award, FileCode, Scale, Database, Cpu } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://councilof.ai'),
  title: {
    default: 'CouncilOf.AI — Cryptographic AI Governance & Measurement OS',
    template: '%s | CouncilOf.AI',
  },
  description: 'Enterprise AI governance platform. Multi-AI consensus, Ed25519-signed cards, and deterministic regulatory compliance for sovereign AI systems.',
  keywords: ['AI governance', 'AI safety', 'enterprise compliance', 'agent catalogue', 'multi-AI consensus', 'byzantine fault tolerance', 'Ed25519', 'EU AI Act'],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://councilof.ai',
    siteName: 'CouncilOf.AI',
    title: 'CouncilOf.AI — Cryptographic AI Governance & Measurement OS',
    description: 'Enterprise AI governance platform with multi-AI consensus and sovereign compliance.',
    images: [{ url: 'https://councilof.ai/og-image.png', width: 1200, height: 630, alt: 'CouncilOf.AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CouncilOf.AI — Cryptographic AI Governance & Measurement OS',
    description: 'Enterprise AI governance platform with multi-AI consensus and sovereign compliance.',
  },
  alternates: { canonical: 'https://councilof.ai' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Navigation() {
  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <a href="/" className="text-lg font-bold">
              <span className="text-brand-400">Council</span>
              <span className="text-foreground">Of</span>
              <span className="text-brand-300">.AI</span>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/os" className="text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1.5 font-semibold">
              <Cpu className="w-4 h-4" /> Council OS
            </a>
            <a href="/assess" className="text-muted-foreground hover:text-foreground transition-colors">Assessment</a>
            <a href="/verify" className="text-muted-foreground hover:text-foreground transition-colors">Verify Card</a>
            <a href="/catalogue" className="text-muted-foreground hover:text-foreground transition-colors">Catalogue</a>
            <a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="https://csoai.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              csoai.org <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/os" className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg gradient-brand text-white hover:opacity-90 transition-opacity shadow-sm">
              Launch OS
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Platform & Tools</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="/os" className="block hover:text-brand-400">Council OS Cockpit</a>
              <a href="/assess" className="block hover:text-brand-400">AI Readiness Assessment</a>
              <a href="/verify" className="block hover:text-brand-400">Card Cryptographic Verifier</a>
              <a href="/catalogue" className="block hover:text-brand-400">Agent Catalogue</a>
              <a href="/pricing" className="block hover:text-brand-400">Tier Plans & Support</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Regulatory Anchors</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="/assess" className="block hover:text-brand-400">EU AI Act (Articles 5, 50, Annex III)</a>
              <a href="/assess" className="block hover:text-brand-400">NIST AI RMF 1.0 / Agent Standards</a>
              <a href="/assess" className="block hover:text-brand-400">UK MoD JSP 936 Defence AI</a>
              <a href="/assess" className="block hover:text-brand-400">ISO/IEC 42001 Management</a>
              <a href="/assess" className="block hover:text-brand-400">DORA ICT & Model Resilience</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Verified Ecosystem</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="https://github.com/CSOAI-ORG" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">GitHub · CSOAI-ORG ↗</a>
              <a href="https://huggingface.co/csoai" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">Hugging Face · csoai ↗</a>
              <a href="https://pypi.org/project/inspect-signed-receipt/" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">PyPI · inspect-signed-receipt ↗</a>
              <a href="https://doi.org/10.5281/zenodo.21991104" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">Zenodo DOI 10.5281 ↗</a>
              <a href="https://csoai.org/.well-known/did.json" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">did:web Trust Root ↗</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Legal & Governance</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="/legal" className="block hover:text-brand-400">Open Attestation Terms</a>
              <a href="/privacy" className="block hover:text-brand-400">Privacy Policy</a>
              <a href="/terms" className="block hover:text-brand-400">Terms of Service</a>
              <div className="pt-2 text-[11px] text-muted-foreground/80">
                CSOAI Ltd (GB) &bull; Companies House #16939677
              </div>
            </div>
          </div>
        </div>

        {/* Standards & Memberships Bar */}
        <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-foreground">Participating Standards:</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">C2PA Contributor</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Open Invention Network</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">DIF Identity Foundation</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Linux Foundation Project</span>
          </div>
          <div className="text-[11px]">
            &copy; 2026 CouncilOf.AI &bull; Measurement, not certification. All signatures Ed25519 verified.
          </div>
        </div>
      </div>
    </footer>
  );
}
