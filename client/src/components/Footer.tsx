/**
 * Unified Footer Component
 * Professional footer with CSOAI branding, newsletter signup, and comprehensive links
 */

import { Link } from 'wouter';
import { Github, Linkedin, Mail, Shield, ArrowRight } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';
import { Button } from '@/components/ui/button';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { name: 'Training Courses', href: '/training' },
        { name: 'Attestation', href: '/certification' },
        { name: 'Watchdog Reports', href: '/watchdog' },
        { name: 'Analyst Workbench', href: '/workbench' },
        { name: 'API Documentation', href: '/api-docs' },
      ],
    },
    {
      title: 'Frameworks',
      links: [
        { name: 'Global AI Regulation Tracker', href: '/global-ai-regulation' },
        { name: 'Framework Crosswalk (13×8)', href: '/crosswalk' },
        { name: 'Article 50 — transparency', href: '/ai-transparency' },
        { name: 'Agent Governance', href: '/agent-governance' },
        { name: 'DORA (financial services)', href: '/dora' },
        { name: 'EU AI Act', href: '/frameworks/eu-ai-act' },
        { name: 'NIST AI RMF', href: '/frameworks/nist' },
        { name: 'ISO 42001', href: '/guides/iso-42001' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'FAQ', href: '/faq' },
        { name: 'Library — full archive', href: '/library' },
        { name: 'The honesty gate — our own losses', href: '/honesty' },
        { name: 'Methodology', href: '/methodology' },
        { name: 'Verify a card', href: '/gspc-verify' },
        { name: 'AI Glossary', href: '/glossary' },
        { name: 'Readiness Assessment', href: '/readiness-assessment' },
        { name: 'Industry Solutions', href: '/industry-solutions' },
        { name: 'Partners & Advisory', href: '/partners' },
        { name: 'Case Studies', href: '/case-studies' },
        { name: 'Trust Center', href: '/trust-center' },
        { name: 'Global AI Regulation Map', href: '/global-ai-regulation' },
        { name: 'Why CSOAI', href: '/compare' },
        { name: 'ROI Calculator', href: '/roi-calculator' },
        { name: 'Blog', href: '/blog' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Technology', href: '/technology' },
        { name: 'Integrations', href: '/integrations' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Contact', href: '/contact' },
        { name: 'Status', href: '/status' },
        { name: 'Remediation Partners', href: '/remediation-partners' },
        { name: 'Careers', href: '/careers' },
        { name: 'Accreditation', href: '/accreditation' },
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
        { name: 'Insurance Certificate (on request)', href: 'mailto:security@csoai.ai?subject=Certificate%20of%20Insurance%20request', external: true },
      ],
    },
  ];

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com/CSOAI-ORG' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/csoai' },
    { name: 'Email', icon: Mail, href: 'mailto:contact@csoai.org' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
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
                <p className="text-emerald-100 text-sm">GSPC 14-slot board — 13 measured axes (12 Aug, 19 models) plus jail, containment (18 Aug, n=71, separation untested). Signed 18 Aug stamp. Harness published — recompute it.</p>
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
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Updated on AI Safety</h3>
              <p className="text-gray-600">Get the latest insights on AI regulations, safety frameworks, and industry updates.</p>
            </div>
            <NewsletterSignup />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
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
            <p className="text-gray-600 text-sm mb-4">
              Building the future of AI safety through independent training, signed attestation, and transparent measurement.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link: any) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-green-600 text-sm transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">
            © {currentYear} CSOAI. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy-policy" className="text-gray-600 hover:text-green-600 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-gray-600 hover:text-green-600 text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/membership-agreement" className="text-gray-600 hover:text-green-600 text-sm transition-colors">
              Membership
            </Link>
            <Link href="/licensing-agreement" className="text-gray-600 hover:text-green-600 text-sm transition-colors">
              Licensing
            </Link>
          </div>
        </div>

        {/* Standards participation & memberships — only genuine, verifiable affiliations.
            A measurement body must never overclaim a membership. DIF is a signed Contributor
            membership; C2PA is Contributor participation with conformance in progress (matches
            the honest status stated below). Swap these text links for official member badges only
            once the body's logo-use guidelines are checked. */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <p className="text-gray-500 text-xs text-center uppercase tracking-wider mb-3">Standards participation &amp; memberships</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a href="https://identity.foundation" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Decentralized Identity Foundation (DIF) — Contributor member
            </a>
            <span className="text-gray-300" aria-hidden="true">·</span>
            <a href="https://c2pa.org" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Content Authenticity / C2PA — Contributor (conformance in progress)
            </a>
            <span className="text-gray-300" aria-hidden="true">·</span>
            <a href="https://doi.org/10.5281/zenodo.21991104" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-emerald-700 transition-colors">
              Zenodo DOI 10.5281/zenodo.21991104
            </a>
          </div>
        </div>

        {/* AI Transparency & Oversight Statement (Art 50 / Art 14) */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <p className="text-gray-600 text-xs text-center max-w-4xl mx-auto mb-2">
            This site uses AI systems, including the Council assistant. Every AI surface is disclosed at
            first interaction under EU AI Act Article 50 and classified publicly on{" "}
            <Link href="/ai-transparency" className="text-emerald-700 underline">/ai-transparency</Link>.
          </p>
          <p className="text-gray-600 text-xs text-center max-w-4xl mx-auto mb-2">
            Human oversight applies to every governed action on this platform (Article 14): measurements are
            machine-run, judgements are human-owned. Our public artefacts carry signed provenance
            (Ed25519-signed records; C2PA conformance in progress — see{" "}
            <Link href="/provenance-finding" className="text-emerald-700 underline">/provenance-finding</Link>).
          </p>
        </div>

        {/* Independence Statement */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <p className="text-gray-600 text-xs text-center max-w-4xl mx-auto mb-2">
            CSOAI is an independent organization with no financial ties to OpenAI, Anthropic, Google, Microsoft, Meta, or any AI vendor.
            Our only incentive is public safety and workforce development.
          </p>
          <p className="text-gray-600 text-xs text-center">
            CSOAI LTD is a UK registered company with Professional Indemnity Insurance up to £5,000,000 (Policy: CHPR5355800XB).
          </p>
        </div>
      </div>
    </footer>
  );
}
