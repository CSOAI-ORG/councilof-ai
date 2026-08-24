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
  external?: boolean;
}

export function Footer() {
  const hideChrome = useSiteChromeHidden();
  if (hideChrome) return null;
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <Shield className="h-8 w-8" />
              <div>
                <h3 className="font-bold text-lg">{POSITIONING.headline}</h3>
                <p className="text-emerald-100 text-sm">{POSITIONING.tagline}</p>
              </div>
            </div>
            <Button type="button" className="bg-white text-emerald-700" onClick={() => openLobby({ pane: 'home' })}>
              {POSITIONING.os.cta}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      <FooterSiteMap />
      <p className="text-center text-sm text-gray-600 py-4">© {currentYear} CSOAI</p>
    </footer>
  );
}
