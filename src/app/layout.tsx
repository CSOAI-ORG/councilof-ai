import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://councilof.ai'),
  title: {
    default: 'CouncilOf.AI — The Global Standard for AI Safety',
    template: '%s | CouncilOf.AI',
  },
  description: 'Enterprise AI governance platform. Multi-AI consensus, agent catalogue, and regulatory compliance for sovereign AI systems.',
  keywords: ['AI governance', 'AI safety', 'enterprise compliance', 'agent catalogue', 'multi-AI consensus', 'byzantine fault tolerance'],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://councilof.ai',
    siteName: 'CouncilOf.AI',
    title: 'CouncilOf.AI — The Global Standard for AI Safety',
    description: 'Enterprise AI governance platform. Multi-AI consensus, agent catalogue, and regulatory compliance.',
    images: [{ url: 'https://councilof.ai/og-image.png', width: 1200, height: 630, alt: 'CouncilOf.AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CouncilOf.AI — The Global Standard for AI Safety',
    description: 'Enterprise AI governance platform with multi-AI consensus and sovereign compliance.',
  },
  alternates: { canonical: 'https://councilof.ai' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Navigation() {
  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <a href="/" className="text-lg font-bold">
              <span className="text-brand-400">Council</span>
              <span className="text-white">Of</span>
              <span className="text-brand-300">.AI</span>
            </a>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <a href="/catalogue" className="text-muted-foreground hover:text-foreground transition-colors">Catalogue</a>
            <a href="/verify" className="text-muted-foreground hover:text-foreground transition-colors">Verify</a>
            <a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                      <a href="/protocols" className="text-muted-foreground hover:text-foreground transition-colors">Protocols</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/pricing" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg gradient-brand text-white hover:opacity-90 transition-opacity">
              Get Started
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-sm font-semibold mb-3">Platform</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="/catalogue" className="block hover:text-foreground">Catalogue</a>
              <a href="/verify" className="block hover:text-foreground">Verify</a>
              <a href="/pricing" className="block hover:text-foreground">Pricing</a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Governance</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="#" className="block hover:text-foreground">EU AI Act</a>
              <a href="#" className="block hover:text-foreground">NIST RMF</a>
              <a href="#" className="block hover:text-foreground">ISO 42001</a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Resources</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="#" className="block hover:text-foreground">Documentation</a>
              <a href="#" className="block hover:text-foreground">API Reference</a>
              <a href="#" className="block hover:text-foreground">Research</a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Legal</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="/legal" className="block hover:text-foreground">Legal</a>
              <a href="/privacy" className="block hover:text-foreground">Privacy</a>
              <a href="/terms" className="block hover:text-foreground">Terms</a>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-xs text-muted-foreground">
          <p>© 2026 CouncilOf.AI. Powered by CSOAI Governance Framework.</p>
        </div>
      </div>
    </footer>
  );
}
