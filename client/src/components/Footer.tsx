/**
 * Unified Footer Component
 * Professional footer with CSOAI branding, newsletter signup, and comprehensive links
 */

import { Link } from 'wouter';
import { Github, Twitter, Linkedin, Mail, Shield, ArrowRight } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';
import { Button } from '@/components/ui/button';
import { BuiltOnFooter } from "@/components/BuiltOnFooter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { name: 'Training Courses', href: '/training' },
        { name: 'Certification', href: '/certification' },
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
        { name: 'Article 50 — transparency', href: '/article-50' },
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
    { name: 'GitHub', icon: Github, href: 'https://github.com/csoai' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/csoai' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/csoai' },
    { name: 'Email', icon: Mail, href: 'mailto:contact@csoai.org' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Byzantine Council CTA Bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <Shield className="h-8 w-8" />
              <div>
                <h3 className="font-bold text-lg">Join the Byzantine Council</h3>
                <p className="text-emerald-100 text-sm">Become part of our 33-agent fault-tolerant oversight system</p>
              </div>
            </div>
            <Link href="/council">
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
              <img
                src="/csoai-icon.svg"
                alt="CSOAI"
                className="h-10 w-10"
              />
              <span className="text-2xl font-bold">CSOAI</span>
            </Link>
            <p className="text-gray-600 text-sm mb-4">
              Building the future of AI safety through independent training, certification, and transparent oversight.
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

        <BuiltOnFooter />

        {/* Anchored To — live watcher timestamps */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Anchored To
          </h4>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              UK legislation.gov.uk · OGL v3.0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              EU AI Act · EUR-Lex CELLAR
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              NIST IR 8547 · FIPS 204
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              RFC 9964 (ML-DSA for COSE)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              C2PA Specification 2.4
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              EU EUR-Lex CELLAR · last checked 2d ago
            </span>
          </div>
        </div>

        {/* What We Don't Claim */}
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
            What We Don&apos;t Claim
          </h4>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>Not a certifier · not an enforcer · no accreditation chain</li>
            <li>Our own systems are scored on this board, no exemption</li>
            <li>We measure. Others enforce. The distinction is the business.</li>
          </ul>
        </div>

        {/* Refutation Ledger — prominent link */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/refutation-ledger"
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            8 published refutations · 4 killed our own bets
          </Link>
          <Link
            href="/live-ledger"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live D1 ledger · signed · queryable
          </Link>
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
