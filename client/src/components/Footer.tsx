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
import { EUNOMIA_ESTATE_LINKS, AGENT_ESTATE_LINKS } from '@/lib/estateLinks';
import FooterSiteMap from '@/components/nav/FooterSiteMap';
import { POSITIONING, CTA_PRIMARY } from '@/lib/positioning';
import { openLobby } from '@/lib/lobbyLink';

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
      title: 'Eunomia & Layer 0',
      links: [
        ...EUNOMIA_ESTATE_LINKS.map((l) => ({ name: l.name, href: l.href })),
        ...AGENT_ESTATE_LINKS.map((l) => ({ name: l.name, href: l.href })),
      ],
    },
    {
      title: 'Product',
      links: [
        { name: 'Live training — Art. 4 sim', href: '/live-training' },
        { name: 'Estate audit', href: '/estate' },
        { name: 'Training Courses', href: '/training' },
        { name: 'Training records (we certify nothing)', href: '/certification' },
        { name: 'Watchdog Reports', href: '/watchdog' },
        { name: 'Analyst Workbench', href: '/workbench' },
        { name: 'Global AI Regulation Tracker', href: '/global-ai-regulation' },
        { name: 'Framework Crosswalk (13×8)', href: '/crosswalk' },
        { name: 'Library — full archive', href: '/library' },
        { name: 'AI Glossary', href: '/glossary' },
        { name: 'Blog', href: '/blog' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Contact', href: '/contact' },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <p className="text-gray-600 text-sm">© {currentYear} CSOAI. All rights reserved.</p>
      </div>
    </footer>
  );
}
