/**
 * Unified Footer Component
 * Professional footer with CSOAI branding, newsletter signup, and comprehensive links
 */

import { Link } from 'wouter';
import { Github, Linkedin, Mail, Shield, ArrowRight } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';
import FooterVerifyStrip from './FooterVerifyStrip';
import { SECTORS } from '@/data/library-ia';
import { Button } from '@/components/ui/button';
import { useSiteChromeHidden } from '@/lib/osChrome';

interface FooterLink {
  name: string;
  href: string;
  /** Plain <a> (new tab) instead of a wouter route — for machine surfaces, static files and mailto. */
  external?: boolean;
}

export function Footer() {
  const hideChrome = useSiteChromeHidden();
  if (hideChrome) return null;
  const currentYear = new Date().getFullYear();

  const footerSections: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Product',
      links: [
        { name: 'Academy (we certify nothing)', href: '/academy' },
        { name: 'Training records (we certify nothing)', href: '/academy' },
        { name: 'Watchdog Reports', href: '/watchdog' },
        { name: 'Analyst Workbench', href: '/workbench' },
        { name: 'Global AI Regulation Tracker', href: '/global-ai-regulation' },
        { name: 'Framework Crosswalk', href: '/crosswalk' },
        { name: 'Library — full archive', href: '/library' },
        { name: 'AI Glossary', href: '/glossary' },
        { name: 'Blog', href: '/blog' },
        { name: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Evidence & APIs',
      links: [
        { name: 'GSPC board — live JSON', href: '/api/gspc', external: true },
        { name: 'Regulation feed — live JSON', href: '/api/regulation', external: true },
        { name: 'Corrections feed — live JSON', href: '/api/corrections', external: true },
        { name: 'Claims register — claim → evidence → status', href: '/claims-register' },
        { name: 'Verify a card', href: '/gspc-verify' },
        { name: 'Embed / white-label', href: '/embed' },
        { name: 'Evidence packs', href: '/evidence-rail' },
        { name: 'llms.txt — for answer engines', href: '/llms.txt', external: true },
        { name: 'did:web trust root (did.json)', href: '/.well-known/did.json', external: true },
        { name: 'API Documentation', href: '/api-docs' },
        { name: 'Methodology', href: '/methodology' },
        { name: 'The honesty gate — our own losses', href: '/honesty' },
        { name: 'Meta-benchmark index — other benchmarks, cited', href: '/benchmark-index' },
        { name: 'Firewall Charter — measure, never fix', href: '/firewall-charter' },
        { name: 'Statute to predicate — how law becomes a test', href: '/statute-to-predicate' },
        { name: 'The accountability loop', href: '/accountability-loop' },
        { name: 'Where the record lives', href: '/where-the-record-lives' },
        { name: 'Attestation on the ledger (devnet-proven; mainnet planned)', href: '/xrpl-attest' },
        { name: 'Products', href: '/products' },
        { name: 'Council OS', href: '/os' },
        { name: 'System card', href: '/system-card' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Technology', href: '/technology' },
        { name: 'Integrations', href: '/integrations' },
        { name: 'Partners & Advisory', href: '/partners' },
        { name: 'Trust Center', href: '/trust-center' },
        { name: 'Case Studies', href: '/case-studies' },
        { name: 'Status', href: '/status' },
        { name: 'Careers', href: '/careers' },
        { name: 'What we do NOT accredit', href: '/accreditation' },
        { name: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Important Disclaimers', href: '/disclaimers' },
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms-of-service' },
        { name: 'Cookie Policy', href: '/cookie-policy' },
        { name: 'Data Processing (GDPR)', href: '/dpa' },
        { name: 'Service Level Agreement', href: '/sla' },
      ],
    },
  ];

  // Framework deep links, kept as a compact row so the column grid stays four-wide.
  const frameworkLinks: FooterLink[] = [
    { name: 'EU AI Act', href: '/frameworks/eu-ai-act' },
    { name: 'Article 50 — transparency', href: '/ai-transparency' },
    { name: 'NIST AI RMF', href: '/frameworks/nist' },
    { name: 'ISO 42001', href: '/guides/iso-42001' },
    { name: 'DORA', href: '/dora' },
    { name: 'Agent Governance', href: '/agent-governance' },
  ];

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com/CSOAI-ORG' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/csoai' },
    { name: 'Email', icon: Mail, href: 'mailto:contact@csoai.org' },
  ];

  return (
    <footer className="surface-raised border-t border-border">
      {/* Measured-finding CTA bar. Replaced the 33-seat Council block on
          2026-08-05: it carried a retracted fault-tolerance claim onto 43 of 45
          pages. What replaces it is the strongest MEASURED result we have. */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <Shield className="h-8 w-8" />
              <div>
                <h3 className="font-bold text-lg">Models refuse generic harm. They do not refuse the regulated practices.</h3>
                <p className="text-emerald-100 text-sm">The living GSPC board is signed. Empty cells stay empty. Live axis and model counts at GET /api/gspc. Harness published — recompute it.</p>
              </div>
            </div>
            <Link href="/benchmarks">
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-6">
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-muted border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">Stay Updated on AI Safety</h3>
              <p className="text-muted-foreground">Get the latest insights on AI regulations, safety frameworks, and industry updates.</p>
            </div>
            <NewsletterSignup />
          </div>
        </div>
      </div>

      <div className="section-shell py-14 sm:py-16">
        {/* Main Footer Content.
            "Evidence & APIs" carries 21 links against 10/10/6 elsewhere, so on a
            single-width column it ran ~600px past the bottom of every other
            column and the whole block read as a ragged L. It now spans two grid
            tracks and flows its own links in two columns — same links, same
            order, same hrefs, balanced block. */}
        {/* Brand block gets its own row. Sharing the link grid squeezed every
            column to ~160px, so nearly every label wrapped to two lines. */}
        <div className="mb-12 grid grid-cols-1 gap-x-8 gap-y-10">
          <div className="measure">
            <Link href="/" className="flex items-center space-x-3 mb-4 hover:opacity-80 transition-opacity">
              {/* Inline shield — /csoai-icon.svg is not in public/, an <img> here 404s */}
              <svg viewBox="0 0 100 100" className="h-10 w-10" aria-hidden="true">
                <defs>
                  <linearGradient id="footerShieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 5 L90 20 L90 50 C90 75 50 95 50 95 C50 95 10 75 10 50 L10 20 Z"
                  fill="url(#footerShieldGradient)"
                />
                <g stroke="#fff" strokeWidth="3" fill="none" opacity="0.9">
                  <line x1="25" y1="30" x2="25" y2="70"/>
                  <line x1="25" y1="40" x2="40" y2="40"/>
                  <line x1="25" y1="55" x2="35" y2="55"/>
                  <circle cx="25" cy="30" r="4" fill="#fff"/>
                  <circle cx="40" cy="40" r="4" fill="#fff"/>
                  <circle cx="35" cy="55" r="4" fill="#fff"/>
                  <circle cx="25" cy="70" r="4" fill="#fff"/>
                </g>
                <g stroke="#fff" strokeWidth="3" fill="none" opacity="0.9">
                  <path d="M55 35 Q70 30 72 45 Q82 45 78 58 Q85 65 70 72 Q65 80 55 72"/>
                  <circle cx="62" cy="45" r="5" fill="#fff"/>
                  <circle cx="72" cy="60" r="5" fill="#fff"/>
                </g>
              </svg>
              <span className="text-2xl font-bold">CSOAI</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-2">
              Building the future of AI safety through independent training, signed attestation, and transparent measurement.
            </p>
            <p className="text-muted-foreground text-sm mb-4 font-medium">
              Measurement, not certification — every published finding links to a signed, recomputable record.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Link Columns */}
          {footerSections.map((section) => {
            const wide = section.links.length > 14;
            return (
            <div key={section.title} className={wide ? "lg:col-span-2" : ""}>
              <h3 className="t-kicker mb-4 text-foreground">
                {section.title}
              </h3>
              <ul className={`space-y-3 ${wide ? "sm:columns-2 sm:gap-x-8 sm:space-y-0 sm:[&>li]:mb-3 sm:[&>li]:break-inside-avoid" : ""}`}>
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary text-sm transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            );
          })}
        </div>

        {/* The Library — secondary navigation for the whole archive.
            "Library, don't delete": the primary nav carries the lean current experience;
            every superseded or reference page stays reachable here, dated and sector-organized,
            which is also where the answer-engine citation surface lives. */}
        <div className="border-t border-border pt-6 mb-6">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/library" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-emerald-700">
              Library — full archive
            </Link>
            {SECTORS.map((sector) => (
              <Link
                key={sector.id}
                href={`/library/${sector.id}`}
                className="text-muted-foreground hover:text-emerald-700 transition-colors"
              >
                {sector.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Compact frameworks row — deep links kept out of the four-column grid */}
        <div className="border-t border-border pt-6 mb-8">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Frameworks</span>
            {frameworkLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-emerald-700 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            © {currentYear} CSOAI. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/membership-agreement" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Membership
            </Link>
            <Link href="/licensing-agreement" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Licensing
            </Link>
          </div>
        </div>

        {/* Find us / verify us — chips for every probed-live platform presence */}
        <FooterVerifyStrip />

        {/* Standards participation & memberships — only genuine, verifiable affiliations.
            A measurement body must never overclaim a membership. DIF is a signed Contributor
            membership; C2PA is Contributor participation with conformance in progress (matches
            the honest status stated below). Swap these text links for official member badges only
            once the body's logo-use guidelines are checked. */}
        <div className="border-t border-border mt-8 pt-8">
          <p className="text-muted-foreground text-xs text-center uppercase tracking-wider mb-3">Standards participation &amp; memberships</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a href="https://identity.foundation" target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-emerald-700 transition-colors">
              Decentralized Identity Foundation (DIF) — participant
            </a>
            <span className="text-muted-foreground" aria-hidden="true">·</span>
            <a href="https://c2pa.org" target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-emerald-700 transition-colors">
              Content Authenticity / C2PA — Contributor (conformance in progress)
            </a>
            <span className="text-muted-foreground" aria-hidden="true">·</span>
            <a href="https://doi.org/10.5281/zenodo.21991104" target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-emerald-700 transition-colors">
              Zenodo DOI 10.5281/zenodo.21991104
            </a>
          </div>
        </div>

        {/* AI Transparency & Oversight Statement (Art 50 / Art 14) */}
        <div className="border-t border-border mt-8 pt-8">
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            This site uses AI systems, including the Council assistant. Every AI surface is disclosed at
            first interaction under EU AI Act Article 50 and classified publicly on{" "}
            <Link href="/ai-transparency" className="text-emerald-700 underline">/ai-transparency</Link>.
          </p>
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            Human oversight applies to every governed action on this platform (Article 14): measurements are
            machine-run, judgements are human-owned. Our public artefacts carry signed provenance
            (Ed25519-signed records; C2PA conformance in progress — see{" "}
            <Link href="/provenance-finding" className="text-emerald-700 underline">/provenance-finding</Link>).
          </p>
        </div>

        {/* Independence Statement */}
        <div className="border-t border-border mt-8 pt-8">
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            CSOAI is an independent organization with no financial ties to OpenAI, Anthropic, Google, Microsoft, Meta, or any AI vendor.
            Our only incentive is public safety and workforce development.
          </p>
          <p className="text-muted-foreground text-xs text-center">
            Council of AI — CSOAI Ltd, UK Companies House 16939677, London. Professional Indemnity Insurance up to £5,000,000 (policy number on request). Contact: nicholas@csoai.org.
          </p>
        </div>
      </div>
    </footer>
  );
}
