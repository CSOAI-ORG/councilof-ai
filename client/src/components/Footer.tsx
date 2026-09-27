/**
 * Slim Footer — 2026-08-28 Owner Stack
 *
 * Compact footer with essential links, framework wordmarks, and honesty line.
 * Newsletter is inline. No duplicate columns.
 */

import { Link } from 'wouter';
import { BookOpen, Linkedin, Mail } from 'lucide-react';
import FooterVerifyStrip from './FooterVerifyStrip';
import FooterStats from './momentum/FooterStats';
import MembershipStrip from './MembershipStrip';
import { PAID_STEP_HREF, PAID_STEP_LINE } from './paidStep';
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
        { name: 'Request attestation', href: '/assess' },
        { name: 'Board', href: '/dashboard?tab=board' },
        { name: 'Tools — plugin snippet', href: '/tools' },
        { name: 'Ask about a measured run', href: '/contact/?arm=run' },
        { name: 'Ledger', href: '/contact/?arm=ledger' },
        { name: 'Data', href: '/contact/?arm=data' },
        { name: 'Library', href: '/library' },
      ],
    },
    // 2026-09-22: a fifth column. Every address below answers today (checked live) and each one
    // is a door an AGENT needs and a human never guesses: the board, the tool surface, the A2A
    // card, the payment manifest with its ten free population previews, the keys and llms.txt.
    // They were reachable only from inside the home page before, so a reader arriving on any
    // other route could not find them at all.
    {
      title: 'For machines',
      links: [
        { name: 'Board JSON — /api/gspc', href: '/api/gspc', external: true },
        { name: 'Tool surface — /mcp', href: '/mcp', external: true },
        { name: 'Agent card', href: '/.well-known/agent.json', external: true },
        { name: 'Metered doors + free previews', href: '/.well-known/x402.json', external: true },
        { name: 'Our public keys', href: '/.well-known/did.json', external: true },
        { name: 'Signed evidence root', href: '/root.json', external: true },
        { name: 'OpenAPI description', href: '/openapi.json', external: true },
      ],
    },
    {
      title: 'Evidence',
      links: [
        { name: 'GSPC JSON', href: '/api/gspc', external: true },
        { name: 'Current evidence mirror', href: 'https://huggingface.co/datasets/csoai/councilof-ai-mirror', external: true },
        { name: 'Methodology', href: '/methodology' },
        { name: 'Honesty gate', href: '/honesty' },
        // The readable ledger page (renders /api/corrections), not raw JSON.
        { name: 'Corrections', href: '/corrections/' },
        { name: 'How far this reaches', href: '/reach' },
        { name: 'llms.txt', href: '/llms.txt', external: true },
        { name: 'API docs', href: '/api-docs' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about/' },
        { name: 'Independence and conflicts', href: '/independence/' },
        { name: 'Contact', href: '/contact/' },
        { name: 'Where we take part', href: '/memberships/' },
        { name: 'Blog', href: '/blog' },
        { name: 'FAQ', href: '/faq/' },
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
    { name: 'Source snapshot', icon: BookOpen, href: 'https://huggingface.co/datasets/csoai/councilof-ai-source' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/csoai' },
    { name: 'Email', icon: Mail, href: 'mailto:contact@csoai.org' },
  ];

  return (
    <footer
      className="surface-raised border-t border-border"
      // The workspace launcher (CouncilLobby) is fixed bottom-right: h-12, lifted
      // 1.25rem + --cookie-banner-h. Measured at 390x664 on 2026-09-14 it sat over
      // the company line at full scroll on 5 of 6 pages, so that line could never
      // be read on a phone. Reserve the launcher's own footprint below the last
      // line, plus the banner's published height, so everything scrolls clear.
      style={{ paddingBottom: "calc(4.25rem + var(--cookie-banner-h, 0px))" }}
    >
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
        <div className="mb-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
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

        {/*
          REFERENCE FRAMEWORKS — text, with the relationship named, never a logo row.
          2026-09-26: "framework we measure against" became "reference framework (no crosswalk
          measured)" for NIST AI RMF, ISO/IEC 42001 and DORA. No signed crosswalk exists for any of
          the three (see /about), so "measure against" said more than we have. The Linux Foundation
          pill left "Bodies we take part in": its only evidence is private (see
          public/interop/memberships.json → excluded).

          WHAT WAS HERE UNTIL 2026-09-23, and why it went. Nine <img> badges drawn in-house at
          /images/badges/frameworks/*.svg: an EU AI Act badge rendering the European emblem's
          circle of twelve stars in the emblem's own #003399 and #FFCC00, a redrawn Tux for the
          Linux Foundation, and seven more. They are not those bodies' assets; they are our
          imitations of their marks, and every one of them sat under our own heading in our own
          footer. That is the arrangement a reader reads as affiliation.

          The five frameworks in the first group are the sharpest case, because we hold NO
          standing with any of them — we measure AGAINST the EU AI Act, NIST AI RMF, ISO/IEC
          42001 and DORA, and there is no relationship to depict. The block had to carry a
          disclaimer ("we are not certified to SOC 2 or ISO 42001") directly under the art to
          stay honest, which is the tell: art that needs a disclaimer beside it is the wrong art.
          The four memberships in the second group ARE real, but a membership is a fact we can
          state in words with a date and a link, which is strictly more information than a logo.

          No body's brand terms were cited for any of the nine, and none of them licenses a third
          party to redraw its mark. So this is now the pattern MembershipStrip already uses on
          /memberships and on the home page: organisation, the kind of participation, and a link
          to that body's own page. Standing and evidence for every membership stay on
          /memberships, backed by public/interop/memberships.json, which
          scripts/memberships-check.mjs re-fetches so a claim cannot outlive its evidence.

          The nine SVGs are left on disk unreferenced rather than deleted, so this decision can
          be read against the exact bytes it was made about.
        */}
        <div className="border-t border-border pt-6 mb-6">
          <p className="text-muted-foreground text-xs text-center uppercase tracking-wider mb-4">
            Reference frameworks
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0">
            {[
              {
                name: 'EU AI Act',
                detail: 'Regulation (EU) 2024/1689',
                href: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
              },
              {
                name: 'NIST AI RMF',
                detail: 'reference framework (no crosswalk measured)',
                href: 'https://www.nist.gov/itl/ai-risk-management-framework',
              },
              {
                name: 'ISO/IEC 42001',
                detail: 'reference framework (no crosswalk measured)',
                href: 'https://www.iso.org/standard/81230.html',
              },
              {
                name: 'DORA',
                detail: 'reference framework (no crosswalk measured)',
                href: 'https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en',
              },
            ].map((f) => (
              <li key={f.name}>
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-baseline gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs transition hover:border-emerald-600/40"
                >
                  <span className="font-bold text-foreground">{f.name}</span>
                  <span className="text-muted-foreground">· {f.detail}</span>
                </a>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground text-xs text-center uppercase tracking-wider mt-6 mb-4">
            Bodies we take part in
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0">
            {[
              { name: 'C2PA', detail: 'contributor', href: 'https://c2pa.org/' },
              { name: 'Open Invention Network', detail: 'member', href: 'https://openinventionnetwork.com/' },
              { name: 'LOT Network', detail: 'member', href: 'https://lotnet.com/' },
              { name: 'Decentralized Identity Foundation', detail: 'did:web trust root', href: 'https://identity.foundation/' },
            ].map((f) => (
              <li key={f.name}>
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-baseline gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs transition hover:border-emerald-600/40"
                >
                  <span className="font-bold text-foreground">{f.name}</span>
                  <span className="text-muted-foreground">· {f.detail}</span>
                </a>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground text-xs text-center mt-4 font-medium">
            Naming a framework is not a claim to comply with it, and taking part in a body is not
            that body endorsing us. We are not certified to SOC 2 or ISO 42001, and we hold no
            certification under any scheme. We publish measurements, never certifications.{' '}
            <Link href="/memberships" className="text-primary underline underline-offset-2 hover:decoration-2">
              Every participation record, with its evidence
            </Link>
            .
          </p>
        </div>

        {/* Live figures from GET /api/momentum: each links to its source and carries its date;
            a figure whose source failed is absent, never zero. */}
        <FooterStats />

        {/* Find us / verify us — live platform logos + listings */}
        <FooterVerifyStrip />

        <p data-paid-step="x402" className="text-muted-foreground text-xs text-center mt-4 mb-2">
          {PAID_STEP_LINE}{" "}
          <a href={PAID_STEP_HREF} className="text-primary underline underline-offset-2 hover:decoration-2">
            GET {PAID_STEP_HREF}
          </a>
        </p>

        {/*
          OWNER RULING 2026-09-22: the seven-stage funnel came out of the site chrome. Four of the
          seven can only say UNMEASURED today, and rendering that column at the foot of every
          page — the home page included — made a row of absences the last thing every visitor
          read. Nothing is hidden and no stage is dropped: the whole funnel, every stage with its
          own state, source and as-of, is published at /api/footprint, and it is named here.
          When the lane rebuilding that measurement lands, this is the line to revisit.
        */}
        <p className="text-muted-foreground text-xs text-center mt-4 mb-2">
          {/* The stages are NAMED on the funnel surface itself, not here. Listing them in this
              line put the commercial ones back on every page in prose, which is the same
              placement problem as the pills. One link, and the discipline lives where it is
              the argument. */}
          Every stage of how far this work travels is measured separately and never added
          together.{" "}
          <Link href="/reach" className="text-primary underline underline-offset-2 hover:decoration-2">
            All seven stages, including the ones we cannot measure yet
          </Link>
        </p>

        {/* Where we take part — one line from public/interop/memberships.json; every name links to
            its evidence. Participation is not endorsement, a listing is not adoption. */}
        <MembershipStrip variant="footer" />

        {/*
          The trust row. A careful reader - and every serious agent - looks for exactly these
          five before believing anything else on a site, and until now they were scattered
          across three columns or not linked at all. Each href was fetched on 2026-09-22 and
          answered 200; /security.txt (without .well-known) is a 404 and is deliberately not
          linked. This row never carries a count, so it cannot go stale.
        */}
        <div className="border-t border-border pt-6 mb-6" data-testid="footer-trust-row">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 list-none p-0 m-0 text-xs">
            {[
              { href: '/.well-known/did.json', label: 'Our decentralised identifier', hint: 'the keys every signature is checked against' },
              { href: '/.well-known/security.txt', label: 'Security contact', hint: 'how to report a vulnerability to us' },
              { href: '/llms.txt', label: 'llms.txt', hint: 'what this site is, written for machines' },
              { href: 'https://find-and-update.company-information.service.gov.uk/company/16939677', label: 'Companies House 16939677', hint: 'CSOAI Ltd on the public register' },
              { href: '/api/corrections', label: 'Corrections ledger', hint: 'everything we have published and had to correct' },
            ].map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  title={l.hint}
                  {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="text-muted-foreground hover:text-primary underline decoration-dotted underline-offset-4 transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {currentYear} CSOAI Ltd · Registered in England & Wales No. 16939677 · 3rd Floor, 86–90 Paul Street, London EC2A 4NE · contact@csoai.org
          </p>
          <p className="text-muted-foreground text-xs">
            To object to, dispute or request a correction of anything we publish: <a href="/dispute/" className="underline">/dispute</a> or <a href="mailto:contact@csoai.org" className="underline">contact@csoai.org</a>. Corrections are dated in the <a href="/corrections/" className="underline">ledger</a>.
          </p>
          <p className="text-muted-foreground text-xs text-center md:text-right max-w-md">
            Independent. No financial ties to OpenAI, Anthropic, Google, Microsoft, Meta, or any AI vendor.
          </p>
        </div>
      </div>
    </footer>
  );
}
