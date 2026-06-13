/**
 * Unified Footer Component
 * Professional footer with CSOAI branding, newsletter signup, and comprehensive links
 */

import { Link } from 'wouter';
import { Github, Twitter, Linkedin, Mail, Shield, ArrowRight } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';
import { Button } from '@/components/ui/button';

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
        { name: 'SOAI-PDCA Framework', href: '/soai-pdca' },
        { name: 'Accreditation', href: '/accreditation' },
        { name: 'EU AI Act', href: '/frameworks/eu-ai-act' },
        { name: 'NIST AI RMF', href: '/frameworks/nist' },
        { name: 'China TC260', href: '/frameworks/tc260' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Our Mission', href: '/about#mission' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Blog', href: '/blog' },
        { name: 'Careers', href: '/careers' },
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
        { name: 'Insurance Certificate', href: '/legal/professional-indemnity-certificate.pdf', external: true },
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
            <Link href="/">
              <a className="flex items-center space-x-3 mb-4 hover:opacity-80 transition-opacity">
                <img
                  src="/csoai-icon.svg.png"
                  alt="CSOAI"
                  className="h-10 w-10"
                />
                <span className="text-2xl font-bold">CSOAI</span>
              </a>
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
                      <Link href={link.href}>
                        <a className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                          {link.name}
                        </a>
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
            <Link href="/privacy-policy">
              <a className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                Privacy Policy
              </a>
            </Link>
            <Link href="/terms-of-service">
              <a className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                Terms of Service
              </a>
            </Link>
            <Link href="/membership-agreement">
              <a className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                Membership
              </a>
            </Link>
            <Link href="/licensing-agreement">
              <a className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                Licensing
              </a>
            </Link>
          </div>
        </div>

        {/* Independence Statement */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <p className="text-gray-600 text-xs text-center max-w-4xl mx-auto mb-2">
            CSOAI is an independent organization with no financial ties to OpenAI, Anthropic, Google, Microsoft, Meta, or any AI vendor.
            Our only incentive is public safety and workforce development.
          </p>
          <p className="text-gray-500 text-xs text-center">
            CSOAI LTD is a UK registered company with Professional Indemnity Insurance up to £5,000,000 (Policy: CHPR5355800XB).
          </p>
        </div>
      </div>
    </footer>
  );
}
