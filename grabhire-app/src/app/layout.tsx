import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import './globals.css';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  metadataBase: new URL(vertical.domain),
  title: {
    default: `${vertical.name} — ${vertical.tagline}`,
    template: `%s | ${vertical.name}`,
  },
  description: vertical.description,
  keywords: [
    'grab hire',
    'skip hire',
    'grab lorry hire',
    'muck away',
    'waste removal',
    'waste carrier',
    'fleet compliance',
    'permit tracking',
    'waste duty of care',
    'EA waste codes',
    'digital waste transfer note',
    'construction waste',
    'UK grab hire',
    'AI compliance',
    'CSOAI',
    'SOV3',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: vertical.domain,
    siteName: vertical.name,
    title: `${vertical.name} — ${vertical.tagline}`,
    description: vertical.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${vertical.name} — ${vertical.tagline}`,
    description: vertical.description,
  },
  alternates: { canonical: vertical.domain },
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
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <a href="/" className="text-lg font-bold text-foreground">
              {vertical.name}
            </a>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="/tools" className="text-muted-foreground hover:text-foreground transition-colors">Tools</a>
            <a href="https://csoai.org" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 transition-colors">csoai.org ↗</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href={vertical.ctaPrimary.href} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg gradient-brand text-white hover:opacity-90 transition-opacity">
              {vertical.ctaPrimary.text}
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
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="/#features" className="block hover:text-foreground">Features</a>
              <a href="/pricing" className="block hover:text-foreground">Pricing</a>
              <a href="/tools" className="block hover:text-foreground">Tools</a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Governance</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="https://csoai.org" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground">CSOAI Standard ↗</a>
              <a href="https://proofof.ai" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground">Verified on proofof.ai ↗</a>
              <a href="https://meok.ai" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground">MEOK AI ↗</a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Ecosystem</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              {vertical.ecosystem.map((d) => (
                <a key={d} href={`https://${d}`} target="_blank" rel="noopener noreferrer" className="block hover:text-foreground">{d} ↗</a>
              ))}
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
          <p>© 2026 {vertical.name}. Powered by CSOAI Governance Framework.</p>
        </div>
      </div>
    </footer>
  );
}
