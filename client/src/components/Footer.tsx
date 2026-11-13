/**
 * The homepage keeps essential destinations visible and the full link directory
 * in a native disclosure. Other public routes retain the existing evidence footer.
 */

import { Link, useLocation } from 'wouter';
import { CouncilBrand } from './brand/CouncilBrand';
import { BookOpen, Mail } from 'lucide-react';
import EmailOff from './EmailOff';
import { CONTACT_MAILBOX } from '@/lib/buying';
import FooterVerifyStrip from './FooterVerifyStrip';
import FooterStats from './momentum/FooterStats';
import AuthoritySignals from './AuthoritySignals';
import MembershipStrip from './MembershipStrip';
import { PAID_STEP_HREF, PAID_STEP_LINE } from './paidStep';
import { useSiteChromeHidden } from '@/lib/osChrome';

interface FooterLink {
  name: string;
  href: string;
  external?: boolean;
  /** A same-tab full page load: the address is served by a Pages Function or a static file,
   *  not by an SPA route, so client-side navigation to it would render the SPA's 404. */
  native?: boolean;
}

export function Footer() {
  const [location] = useLocation();
  const homepage = location === "/";
  const Directory = homepage ? "details" : "div";
  const hideChrome = useSiteChromeHidden();
  if (hideChrome) return null;
  const currentYear = new Date().getFullYear();

  const footerSections: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Product',
      links: [
        { name: 'Check a record', href: '/gspc-verify/' },
        { name: 'Services and buying', href: '/services/' },
        { name: 'Measurement enquiries', href: '/assess/' },
        { name: 'Board', href: '/dashboard/?tab=board' },
        { name: 'Connect tools to your AI', href: '/tools/' },
        { name: 'Ask about a measured run', href: '/contact/?arm=run' },
        { name: 'Evidence feed enquiries', href: '/contact/?arm=ledger' },
        // A licensing enquiry, not a download: the label says so, and the free download sits beside it.
        { name: 'Data licensing (enquiry)', href: '/contact/?arm=data' },
        { name: 'Download the board data', href: '/board/#board-download' },
        { name: 'Library', href: '/library/' },
      ],
    },
    // 2026-09-22: a fifth column. Every address below answers today (checked live) and each one
    // is a door an AGENT needs and a human never guesses: the board, the tool surface, the A2A
    // card, the payment manifest with its ten free population previews, the keys and llms.txt.
    // They were reachable only from inside the home page before, so a reader arriving on any
    // other route could not find them at all.
    {
      title: 'Developer reference',
      links: [
        { name: 'Connect a client — install', href: '/connect/' },
        { name: 'Board JSON — /api/gspc', href: '/api/gspc', external: true },
        { name: 'Tool surface — /mcp', href: '/mcp', external: true },
        { name: 'Python package — PyPI', href: 'https://pypi.org/project/csoai/', external: true },
        { name: 'MCP package — npm', href: 'https://www.npmjs.com/package/csoai-gspc-mcp', external: true },
        { name: 'Agent card', href: '/.well-known/agent.json', external: true },
        { name: 'Paid services and free previews', href: '/.well-known/x402.json', external: true },
        { name: 'Our public keys', href: '/.well-known/did.json', external: true },
        { name: 'Signed evidence root', href: '/root.json', external: true },
        { name: 'OpenAPI description', href: '/openapi.json', external: true },
      ],
    },
    {
      title: 'Evidence',
      links: [
        { name: 'Measurement data (JSON)', href: '/api/gspc', external: true },
        { name: 'GSPC Master dataset', href: 'https://huggingface.co/datasets/csoai/gspc-master', external: true },
        { name: 'Metered evidence catalog (live quotes)', href: '/metered/' },
        { name: 'Evidence files (cards, proofs)', href: 'https://huggingface.co/datasets/csoai/councilof-ai-evidence', external: true },
        { name: 'Methodology', href: '/methodology/' },
        { name: 'Measurement scope and limitations', href: '/honesty/' },
        // The readable ledger page (renders /api/corrections), not raw JSON.
        { name: 'Corrections', href: '/corrections/' },
        { name: 'How far this reaches', href: '/reach/' },
        { name: 'llms.txt', href: '/llms.txt', external: true },
        { name: 'API docs', href: '/api-docs/' },
      ],
    },
    // 2026-09-28 (search-reach): the published record pages. A live crawl of the 443 sitemap URLs
    // found every one of these with ZERO links from any other page — reachable from the sitemap
    // alone, so a crawler that follows links never met them and an answer engine had no path in.
    // Each href answered 200 on 2026-09-28. They are Pages Functions or static files, hence native.
    {
      title: 'Technical records',
      links: [
        { name: 'MCP servers — declared vs observed', href: '/mcp-servers/', native: true },
        { name: 'A2A agent cards — listed vs served', href: '/agent-cards/', native: true },
        { name: 'Payment-service records (x402)', href: '/x402/', native: true },
        { name: 'Tokenised-asset deployments', href: '/stablecoins/deployments/', native: true },
        { name: 'Daily measurement notes', href: '/notes/daily/', native: true },
        { name: 'GSPC axes, one page each', href: '/axes', native: true },
        { name: 'Signed findings', href: '/findings/', native: true },
        { name: 'Claim maintenance', href: '/claim-maintenance/', native: true },
        { name: 'Records feed (Atom)', href: '/feeds/records.xml', native: true },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about/' },
        { name: 'Operation and external use', href: '/traction/' },
        { name: 'Partners and investors', href: '/traction/#partners' },
        { name: 'Brand & impostor notice', href: '/brand/' },
        { name: 'Evidence and reuse rights', href: '/licensing-agreement/#rights' },
        { name: 'Independence and conflicts', href: '/independence/' },
        { name: 'Contact', href: '/contact/' },
        { name: 'Where we take part', href: '/memberships/' },
        { name: 'FAQ', href: '/faq/' },
        { name: 'Careers', href: '/careers/' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Disclaimers', href: '/disclaimers/' },
        { name: 'Privacy', href: '/privacy-policy/' },
        { name: 'Terms', href: '/terms-of-service/' },
        { name: 'Refunds', href: '/refund-policy/' },
      ],
    },
  ];

  // The home page keeps its essential destinations visible. The disclosure carries
  // the remaining directory once, with no repeated destinations or live widgets.
  const homepageEssentials = new Set([
    "/board/", "/#how-it-works", "/connect/", "/about/", "/gspc-verify/",
    "/methodology/", "/.well-known/did.json", "/corrections/", "/contact/",
    "/memberships/", "/independence/", "/privacy-policy/", "/terms-of-service/",
    "/.well-known/security.txt", "/llms.txt",
  ]);
  const seen = new Set(homepageEssentials);
  const directorySections = homepage ? footerSections.map((section) => ({
    ...section,
    links: section.links.filter((link) => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    }),
  })).filter((section) => section.links.length > 0) : footerSections;

  const socialLinks = [
    { name: 'Source snapshot (archived)', icon: BookOpen, href: 'https://archive.softwareheritage.org/browse/origin/directory/?origin_url=https://github.com/CSOAI-ORG/councilof-ai' },
    // linkedin.com/company/csoai is a 404 (no page exists yet, 2026-11-02 audit).
    // Re-add here the day the company page goes live.
    { name: 'Email', icon: Mail, href: `mailto:${CONTACT_MAILBOX}` },
  ];

  return (
    <footer
      className="surface-raised border-t border-border"
      // Reserve the cookie banner's published height below the last line so the
      // company line scrolls clear of it on a phone. (The fixed workspace launcher
      // this also used to clear was removed on 27 Sep 2026.)
      style={{ paddingBottom: "calc(1rem + var(--cookie-banner-h, 0px))" }}
    >
      <div className={homepage ? "section-shell py-10 sm:py-12" : "section-shell py-8 sm:py-10"}>
        {/* Brand + socials */}
        <div className={homepage ? "mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8" : "mb-7 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6"}>
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <CouncilBrand size="sm" />
          </Link>
          <p className="text-muted-foreground text-sm max-w-md">
            An operating UK AI measurement and evidence organisation run by CSOAI Ltd. We publish records you can check. Measurement is not certification.
          </p>
          <div className="-mx-2.5 flex gap-1 sm:ml-auto">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                // 44x44 hit area around a 20px glyph (audit 2026-09-30 #8: the bare icon was 20x20).
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                aria-label={social.name}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {homepage && (
          <nav aria-label="Footer essentials" className="mb-7 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
            {[
              { title: "Explore", links: [
                { label: "Measurement results", href: "/board/" },
                { label: "How it works", href: "/#how-it-works" },
                { label: "Developers", href: "/connect/" },
                { label: "About Council of AI", href: "/about/" },
              ] },
              { title: "Check the evidence", links: [
                { label: "Verify a record", href: "/gspc-verify/" },
                { label: "Methodology", href: "/methodology/" },
                { label: "Public keys", href: "/.well-known/did.json" },
                { label: "Corrections", href: "/corrections/" },
              ] },
              { title: "Company", links: [
                { label: "Contact", href: "/contact/" },
                { label: "Participation records", href: "/memberships/" },
                { label: "Independence and conflicts", href: "/independence/" },
                { label: "Privacy", href: "/privacy-policy/" },
                { label: "Terms", href: "/terms-of-service/" },
              ] },
            ].map((group) => (
              <div key={group.title}>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground">{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}><a href={link.href} className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}

        <Directory className={homepage ? "mb-7 border-y border-border" : undefined}>
          {homepage && (
            <summary className="min-h-12 cursor-pointer py-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
              Full evidence and developer directory
            </summary>
          )}
          <div className={homepage ? "pb-6 pt-4" : undefined}>

        {/* Link columns (6) */}
        <div className="mb-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {directorySections.map((section) => (
            <div key={section.title}>
              <h3 className="t-kicker mb-3 text-foreground">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.native ? (
                      <a href={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                        {link.name}
                      </a>
                    ) : link.external ? (
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

          </div>
        </Directory>

        {homepage && (
          <nav aria-label="Company and security records" className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <a href="https://find-and-update.company-information.service.gov.uk/company/16939677" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center underline decoration-dotted underline-offset-4 hover:text-primary">Companies House 16939677</a>
            <a href="/.well-known/security.txt" className="inline-flex min-h-9 items-center underline decoration-dotted underline-offset-4 hover:text-primary">Security contact</a>
            <a href="/llms.txt" className="inline-flex min-h-9 items-center underline decoration-dotted underline-offset-4 hover:text-primary">Machine-readable guide</a>
          </nav>
        )}

        {!homepage && (<>
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
            <Link href="/memberships/" className="text-primary underline underline-offset-2 hover:decoration-2">
              Every participation record, with its evidence
            </Link>
            .
          </p>
        </div>

        {/* Live figures from GET /api/momentum: each links to its source and carries its date;
            a figure whose source failed is absent, never zero. */}
        <FooterStats />

        {/* Standing, participation and official-source work — distinct relationships, each linked
            to its evidence. Regulators are never presented as members, clients or endorsers. */}
        <AuthoritySignals />

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
          <Link href="/reach/" className="text-primary underline underline-offset-2 hover:decoration-2">
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
              { href: '/corrections/', label: 'Corrections ledger', hint: 'everything we have published and had to correct' },
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

        </>)}

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {currentYear} CSOAI Ltd · Registered in England & Wales No. 16939677 · 3rd Floor, 86–90 Paul Street, London EC2A 4NE · <EmailOff text={CONTACT_MAILBOX} />
          </p>
          <p className="text-muted-foreground text-xs">
            To object to, dispute or request a correction of anything we publish: <a href="/dispute/" className="underline">/dispute</a> or <a href={`mailto:${CONTACT_MAILBOX}`} className="underline">{CONTACT_MAILBOX}</a>. Corrections are dated in the <a href="/corrections/" className="underline">ledger</a>.
          </p>
          <p className="text-muted-foreground text-xs text-center md:text-right max-w-md">
            Who runs and funds us, and where we have an interest:{" "}
            <a href="/independence/" className="underline">
              independence and conflicts
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
