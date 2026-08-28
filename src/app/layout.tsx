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

import { Providers } from './Providers';
import { LayoutWrapper } from './LayoutWrapper';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="/csoai-icon.svg" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Providers>
          <LayoutWrapper footer={<Footer />}>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-bold text-emerald-900 mb-4">Measurement</h3>
            <ul className="space-y-3">
              <li><a href="/os" className="text-muted-foreground hover:text-emerald-700 text-sm">Council OS Workspace</a></li>
              <li><a href="/?lobby=board" className="text-muted-foreground hover:text-emerald-700 text-sm">Live Board (GET /api/gspc)</a></li>
              <li><a href="/?lobby=verify" className="text-muted-foreground hover:text-emerald-700 text-sm">Verify a 3KB Card</a></li>
              <li><a href="/?lobby=measured" className="text-muted-foreground hover:text-emerald-700 text-sm">Request Measurement</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 mb-4">Regulation (EU)</h3>
            <ul className="space-y-3">
              <li><a href="/?lobby=evidence" className="text-muted-foreground hover:text-emerald-700 text-sm">GPAI Evidence Pack</a></li>
              <li><a href="/?task=art5-rail" className="text-muted-foreground hover:text-emerald-700 text-sm">Article 5 Rail</a></li>
              <li><a href="/?task=insurer-rail" className="text-muted-foreground hover:text-emerald-700 text-sm">Underwriting Evidence</a></li>
              <li><a href="/?task=vendor-dsh" className="text-muted-foreground hover:text-emerald-700 text-sm">Vendor Procurement</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 mb-4">Integrations</h3>
            <ul className="space-y-3">
              <li><a href="/?lobby=embed" className="text-muted-foreground hover:text-emerald-700 text-sm">Embed / White-label</a></li>
              <li><a href="/github-action" className="text-muted-foreground hover:text-emerald-700 text-sm">GitHub Action</a></li>
              <li><a href="https://pypi.org/project/csoai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-700 text-sm">PyPI (csoai)</a></li>
              <li><a href="https://pypi.org/project/proofof-ai-mcp/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-700 text-sm">MCP (Model Context Protocol)</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="/methodology" className="text-muted-foreground hover:text-emerald-700 text-sm">Methodology</a></li>
              <li><a href="/legal" className="text-muted-foreground hover:text-emerald-700 text-sm">Terms of Service</a></li>
              <li><a href="/privacy" className="text-muted-foreground hover:text-emerald-700 text-sm">Privacy Policy</a></li>
              <li><a href="/ai-transparency" className="text-muted-foreground hover:text-emerald-700 text-sm">AI Transparency (Art. 50)</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            This site uses AI systems, including the Council assistant. Every AI surface is disclosed at first interaction under EU AI Act Article 50 and classified publicly on <a href="/ai-transparency" className="text-emerald-700 underline">/ai-transparency</a>.
          </p>
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            Human oversight applies to every governed action on this platform (Article 14): measurements are machine-run, judgements are human-owned. Our public artefacts carry signed provenance.
          </p>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            CSOAI is an independent organization with no financial ties to OpenAI, Anthropic, Google, Microsoft, Meta, or any AI vendor. Our only incentive is public safety and workforce development.
          </p>
          <p className="text-muted-foreground text-xs text-center">
            Council of AI — CSOAI Ltd, UK Companies House 16939677, London. Professional Indemnity Insurance up to £5,000,000. Contact: press@councilof.ai.
          </p>
        </div>
      </div>
    </footer>
  );
}
