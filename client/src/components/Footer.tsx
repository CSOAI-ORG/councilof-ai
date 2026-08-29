/**
 * Slim Footer — 2026-08-28 Owner Stack
 *
 * Compact footer with essential links, framework wordmarks, and honesty line.
 * Newsletter is inline. No duplicate columns.
 */

import { Link } from 'wouter';
import { Github, Linkedin, Mail } from 'lucide-react';
import FooterVerifyStrip from './FooterVerifyStrip';
import { useSiteChromeHidden } from '@/lib/osChrome';

interface FooterLink {
  name: string;
  href: string;
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
        { name: 'Verify a card', href: '/gspc-verify' },
        { name: 'Get measured', href: '/assess' },
        { name: 'Board', href: '/gspc-scoreboard' },
        { name: 'Tools — plugin snippet', href: '/tools' },
        { name: 'Run / re-attest', href: '/assess' },
        { name: 'Ledger', href: '/contact?arm=ledger' },
        { name: 'Data', href: '/contact?arm=data' },
        { name: 'Library', href: '/library' },
      ],
    },
    {
      title: 'Evidence',
      links: [
        { name: 'GSPC JSON', href: '/api/gspc', external: true },
        { name: 'Methodology', href: '/methodology' },
        { name: 'Honesty gate', href: '/honesty' },
        { name: 'Corrections', href: '/api/corrections', external: true },
        { name: 'llms.txt', href: '/llms.txt', external: true },
        { name: 'API docs', href: '/api-docs' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'Partners', href: '/partners' },
        { name: 'Blog', href: '/blog' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Disclaimers', href: '/disclaimers' },
        { name: 'Privacy', href: '/privacy-policy' },
        { name: 'Terms', href: '/terms-of-service' },
        { name: 'GDPR / DPA', href: '/dpa' },
      ],
    },
  ];

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com/CSOAI-ORG' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/csoai' },
    { name: 'Email', icon: Mail, href: 'mailto:contact@csoai.org' },
  ];

  return (
    <footer className="surface-raised border-t border-border">
      <div className="section-shell py-12 sm:py-14">
        {/* Brand + socials */}
        <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <svg viewBox="0 0 100 100" className="h-9 w-9" aria-hidden="true">
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
            <span className="text-xl font-bold">CSOAI</span>
          </Link>
          <p className="text-muted-foreground text-sm max-w-md">
            Independent measurement body. Signed attestation and transparent measurement — never certification.
          </p>
          <div className="flex space-x-4 sm:ml-auto">
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

        {/* Link columns (4) */}
        <div className="mb-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="t-kicker mb-3 text-foreground">{section.title}</h3>
              <ul className="space-y-2">
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
          ))}
        </div>

        {/* Framework wordmarks */}
        <div className="border-t border-border pt-6 mb-6">
          <p className="text-muted-foreground text-xs text-center uppercase tracking-wider mb-4">
            Framework alignment
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">EU AI Act</span>
            <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">NIST AI RMF</span>
            <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">ISO 42001</span>
            <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">DORA</span>
            <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">C2PA</span>
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">OIN</span>
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">LOT Network</span>
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">DIF</span>
          </div>
          <p className="text-muted-foreground text-xs text-center mt-4 font-medium">
            We are not certified to SOC 2 or ISO 42001. Measurement credential, never certification.
          </p>
        </div>

        {/* Find us / verify us — chips for every probed-live platform presence */}
        <FooterVerifyStrip />

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {currentYear} CSOAI Ltd · UK Companies House 16939677 · London · contact@csoai.org
          </p>
          <p className="text-muted-foreground text-xs text-center md:text-right max-w-md">
            Independent. No financial ties to OpenAI, Anthropic, Google, Microsoft, Meta, or any AI vendor.
          </p>
        </div>
      </div>
    </footer>
  );
}
