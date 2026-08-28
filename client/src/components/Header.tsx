/**
 * Master Header Component with Professional Mega Menu
 * Clean, modern navigation with CSOAI branding
 */

import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, Search, Award, Building2, Landmark, Globe2, BookMarked, ShieldCheck, BarChart2, Boxes, LayoutGrid } from 'lucide-react';
import { NotificationCenter } from '@/pages/NotificationCenter';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteChromeHidden } from '@/lib/osChrome';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlobalSearch } from '@/components/GlobalSearch';
import { HOME_NAV } from '@/components/homeNav';
export { HOME_NAV };

// ---------------------------------------------------------------------------
// MASTER NAVIGATION — the lean canonical IA.
//
// Rev 2026-08-26 (front-door alignment). The previous six groups predated the
// product family and the Council OS lobby, so the six product pages sat buried
// four items deep inside "Solutions" and the OS was reachable only from a single
// "Chat" pill in the chrome. Two structural changes:
//
//   * PRODUCTS is now a top-level group — the six signed-evidence products plus
//     the /products packaging page, with the audiences they serve as the tail.
//   * COUNCIL OS is now a top-level group — the lobby panes are real destinations
//     (?lobby=<tab>), not a chat gimmick, and the recovered arena views live here.
//
// ...and "Academy" folded into Company: four of its five items pointed at the
// identical /academy URL, so it was a dropdown that mostly linked to itself.
//
// Still six groups, so the xl mega-menu still fits. The primary nav points at
// CURRENT pages exclusively; everything else stays reachable through the footer
// Library (/library), dated and sector-organized. "Library, don't delete."
//
// EVERY href below is verified against client/src/App.tsx, and every internal
// path is registered in PRIMARY_PATHS (client/src/data/library-ia.ts) — an
// unregistered path renders the "archived" banner under a primary nav link,
// which is exactly the drift this nav exists to prevent.
//
// Items flagged `external` are machine surfaces (live JSON, did:web) — they open
// in a new tab and are deliberately in the nav because the site serves agents
// (A2A) as well as humans. `section` renders a non-focusable subheading so a long
// dropdown stays scannable.
// ---------------------------------------------------------------------------

interface NavItem { name: string; href: string; description: string; external?: boolean; section?: string }
interface NavGroup { name: string; href: string; icon: typeof Globe2; description: string; submenu: NavItem[] }

const navigation: NavGroup[] = [
  {
    name: 'Measure',
    href: '/gspc-scoreboard',
    icon: BarChart2,
    description: 'The instrument and its living board',
    submenu: [
      { section: 'The board', name: 'The GSPC board', href: '/gspc-scoreboard', description: 'Every published axis. Counts and the stamp date come from GET /api/gspc — never typed into a page' },
      { name: 'The arena', href: '/gspc-arena', description: 'Head-to-head on the same frozen items. Deterministic grading — no model judges another' },
      { name: 'Arena — benchmarks', href: '/gspc-arena?view=benchmarks', description: 'The per-bank view of the arena: which instrument, which rows, which result' },
      { name: 'Arena — live training', href: '/gspc-arena?view=training', description: 'Runs in progress. Practice stays practice and is never quoted' },
      { name: 'Measured models', href: '/models', description: 'Ranked by signed GSPC results, not by parameter count' },
      { name: 'Measured results', href: '/benchmarks', description: 'Every number traces to a published artefact — the losses included' },
      { section: 'Get a card', name: 'Free signed assessment', href: '/assess', description: 'Measure your own system and get the signed record back. No account, no fee' },
      { name: 'Verify a signed card', href: '/gspc-verify', description: 'Check any Ed25519-signed record offline against the published key. Free forever' },
      { name: 'Report an AI incident', href: '/report', description: 'Anyone can flag AI behaviour that looks wrong — the intake is public, not a vendor inbox' },
      { section: 'How it works', name: 'Methodology', href: '/methodology', description: 'Gold labels, n≥30, McNemar separation — and how to recompute every number yourself' },
      { name: 'The GSPC instrument', href: '/instrument', description: 'Four deterministic lenses over frozen provisions. No model sits in the verdict path' },
      { name: 'Published tools', href: '/tools', description: 'MCP servers you can run yourself — not a marketplace' },
      { section: 'Specialist boards', name: 'Financial axis', href: '/financial-axes', description: 'The declared financial slots — measured where measured, UNMEASURED and honest where not' },
      { name: 'EUNOMIA board', href: '/eunomia', description: 'Financial-verification axis, signed, across a two-tier fleet' },
      { name: 'Signed registers', href: '/registers', description: 'The financial-axis register — a stranger can re-derive every row' },
      { name: 'First-Fine Watch', href: '/first-fine-watch', description: 'Signed enforcement record: EU AI Act fines and the deadlines behind them' },
      { name: 'EUNOMIA data (commercial)', href: '/eunomia-data', description: 'x402 data-only lane — enforcement record + deadline calendar, never scores' },
      { name: 'EUNOMIA catalog', href: '/eunomia-catalog', description: 'Every surface, API, HF mirror, A2A card and MCP tool — catalogued and linked' },
      { name: 'EU AI Act × CRA watch', href: '/eunomia-crosswalk', description: 'Statute → axis → requirement → exposure, with live source links' },
      { name: 'EUNOMIA indices', href: '/eunomia-indices', description: 'The aspirational index axes — now measured (frozen gold sets, Wilson CI)' },
    ],
  },
  {
    name: 'Products',
    href: '/products',
    icon: Boxes,
    description: 'Signed evidence — and who it is for',
    submenu: [
      { section: 'The family', name: 'All products', href: '/products', description: 'One door onto the whole family. Verification is free forever, a grade is never sold, no public prices' },
      { name: 'GPAI Evidence Pack', href: '/gpai-evidence', description: 'Independent third-party evidence a GPAI provider can hand the AI Office. Evidence, never a conformity mark' },
      { name: 'CRA Readiness Kit', href: '/cra-readiness', description: 'The 24h / 72h / 14-day ENISA runbook and signed SBOM workflow we run on ourselves' },
      { name: 'Financial axis', href: '/financial-axes', description: 'The declared financial slots, coverage stated first — never a credit rating' },
      { name: 'Distribution integrity', href: '/distribution-integrity', description: 'Represented is not distributed: the committed-versus-distributed spread, coverage-first and UNMEASURED' },
      { name: 'Verify embed / white-label', href: '/embed', description: 'A self-verifying badge for your own site — WebCrypto checks the signature in the reader’s browser' },
      { name: 'Legacy modernization on-ramp', href: '/cobolbridge', description: 'COBOL lineage under DORA / Basel / SOX carried into signed, continuous evidence' },
      { section: 'Who it is for', name: 'Enterprise', href: '/enterprise', description: 'Measure a portfolio of systems against the duties that actually bind them' },
      { name: 'Insurers and underwriters', href: '/insurers', description: 'An observed behavioural sample with a stated n and interval — something a risk model can price' },
      { name: 'Government and regulators', href: '/government', description: 'Independent measurement with a published method. We issue no conformity mark' },
      { name: 'Industries', href: '/industries', description: 'Sector by sector: the provisions that apply, and when they bite' },
      { name: 'Sector tooling', href: '/sectors', description: 'White-label tooling per sector — regulator, insurer, bond, legacy, vendor' },
      { name: 'Integrations', href: '/integrations', description: 'Wire the measurement into the tools you already run' },
      { name: 'How the free rail works', href: '/?lobby=measured&task=pricing-overview', description: 'Verify is free. A grade is never sold. There are no public prices' },
    ],
  },
  {
    name: 'Regulation',
    href: '/eu-ai-act',
    icon: Landmark,
    description: 'The statute we measure against',
    submenu: [
      { name: 'EU AI Act — the guide', href: '/eu-ai-act', description: 'The whole Act, phased, with the Digital Omnibus amendments' },
      { name: 'Article 50 — transparency', href: '/article-50', description: 'Live since 2 Aug 2026; the marking grace period ends 2 Dec 2026' },
      { name: 'Dates and deadlines', href: '/ai-act-timeline', description: 'What applies when — Annex III deferred to 2 Dec 2027' },
      { name: 'GPAI model duties', href: '/gpai', description: 'Documentation, training-data summary, copyright policy' },
      { name: 'Readiness checklist', href: '/checklist', description: 'Work through the duties that are actually in force today' },
      { name: 'Global regulation tracker', href: '/regulation-tracker', description: 'Every AI regime worldwide, with its current dates' },
      { name: 'Regulator atlas', href: '/regulators', description: 'Who supervises what, jurisdiction by jurisdiction' },
      { name: 'Framework crosswalk', href: '/crosswalk', description: 'Map existing ISO 42001 / NIST controls onto Act duties' },
      { name: 'Regulation feed — live JSON', href: '/api/regulation', description: 'The machine-readable corpus and deadline feed', external: true },
    ],
  },
  {
    name: 'Council OS',
    href: '/os',
    icon: LayoutGrid,
    description: 'One workspace over the whole rail',
    submenu: [
      { section: 'The workspace', name: 'Open Council OS', href: '/os', description: 'The desktop: every live surface in one place, with a concierge that answers from published measurement or refuses' },
      { name: 'Lobby home', href: '/?lobby=home', description: 'Chat is the OS. The lobby frames the live page — a pane can never drift from the page it shows' },
      { section: 'Panes', name: 'Live board', href: '/?lobby=board', description: 'The living GSPC board, with in-lane measurements beside it — never mixed into board totals' },
      { name: 'Verify a card', href: '/?lobby=verify', description: 'The offline verifier, in the workspace' },
      { name: 'Get measured', href: '/?lobby=measured', description: 'Start a signed assessment of your own system' },
      { name: 'Council Space', href: '/?lobby=space', description: 'The continuous contest — model against model on one instrument' },
      { name: 'Models', href: '/?lobby=models', description: 'What we measured, and what it scored' },
      { name: 'Tools', href: '/?lobby=tools', description: 'The published MCP surface, runnable' },
      { name: 'Report an incident', href: '/?lobby=watchdog', description: 'The public intake for AI behaviour that looks wrong' },
      { name: 'Honesty gate', href: '/?lobby=claimguard', description: 'What we cannot yet measure — published rather than hidden' },
      { name: 'Readiness assessment', href: '/?lobby=ras', description: 'Work out which duties bind you before you measure' },
      { name: 'Library', href: '/?lobby=library', description: 'Everything we have published, in the workspace' },
      { name: 'Workbench', href: '/workbench', description: 'The signed-in working surface' },
    ],
  },
  {
    name: 'Evidence',
    href: '/honesty',
    icon: ShieldCheck,
    description: 'Our receipts, including the losses',
    submenu: [
      { section: 'What we got wrong', name: 'The honesty gate', href: '/honesty', description: 'What we cannot yet measure, published rather than quietly omitted' },
      { name: 'Refutation Ledger', href: '/refutation-ledger', description: 'Experiments that killed our own theses — with the artefacts attached' },
      { name: 'Firewall Charter', href: '/firewall-charter', description: 'We measure; we never fix what we measure' },
      { name: 'Corrections — live JSON', href: '/api/corrections', description: 'Append-only. Corrections are published, never silently edited', external: true },
      { section: 'Machine surfaces', name: 'GSPC board — live JSON', href: '/api/gspc', description: 'The board exactly as an agent reads it', external: true },
      { name: 'did:web trust root', href: '/.well-known/did.json', description: 'The published signer — verify a card without us', external: true },
      { name: 'API documentation', href: '/api-docs', description: 'Every endpoint above, documented for agents' },
      { name: 'System status', href: '/status', description: 'What is up, and what is degraded' },
      { section: 'Interop', name: 'Attestation on a public ledger', href: '/xrpl-attest', description: 'Devnet-proven; mainnet planned. Permissionless attach of signed evidence to accounts we do not control. Never a rating' },
      { name: 'Report an AI incident', href: '/report', description: 'A public intake. What we act on is measured and signed like everything else' },
    ],
  },
  {
    name: 'Company',
    href: '/about',
    icon: BookMarked,
    description: 'Council of AI — CSOAI Ltd',
    submenu: [
      { section: 'Who we are', name: 'About', href: '/about', description: 'An independent measurement instrument — and what that deliberately excludes' },
      { name: 'Trust Center', href: '/trust-center', description: 'Security posture — and the certifications we have NOT been awarded' },
      { name: 'Contact', href: '/contact', description: 'CSOAI Ltd, UK company 16939677' },
      { name: 'Legal and disclaimers', href: '/disclaimers', description: 'What a measurement card is not' },
      { section: 'Read', name: 'The Library — full archive', href: '/library', description: 'Everything we have published, dated and organized by sector' },
      { name: 'Blog', href: '/blog', description: 'Findings, corrections and notes' },
      { name: 'Questions people ask', href: '/faq', description: 'The plain-English answers, including the refusals' },
      { section: 'Academy', name: 'Council Academy', href: '/academy', description: 'Learn the statute and the method. Completion attests training, never conformity' },
      { name: 'Verify a training record', href: '/verify-certificate', description: 'Check a signed completion record. Verification is free forever' },
      { name: 'Accreditation — what we are not', href: '/accreditation', description: 'There is no accreditation chain behind us, and we say so' },
    ],
  },
];

/** Archive mega-menu. Not rendered on the marketing chrome. */
export const ARCHIVE_NAV = navigation;

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideChrome = useSiteChromeHidden();

  // A group href may carry a query (the lobby panes are real destinations, e.g.
  // "/?lobby=measured&task=..."). Compare on the PATH only — `location` from wouter
  // never contains the query, so a naive startsWith on the full href always missed
  // and the group could never light up as active.
  const isActive = (href: string) => {
    const path = href.split(/[?#]/)[0];
    if (!path || path === '/') return false;
    return location === path || location.startsWith(path + '/');
  };

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard: Escape closes the open mega-menu and returns focus to its trigger.
  // Without this a keyboard user who opened a group had no way out but Tab-through.
  useEffect(() => {
    if (!activeDropdown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const trigger = dropdownRef.current?.querySelector<HTMLButtonElement>(
        `[data-nav-trigger="${CSS.escape(activeDropdown)}"]`,
      );
      setActiveDropdown(null);
      trigger?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeDropdown]);

  if (hideChrome) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 shadow-sm backdrop-blur-md">
      <nav id="navigation" className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            {/* Institutional mark — flat green shield, white field, measurement temple.
                Flat by design: a gradient shield reads as a software product, a flat one
                reads as a standards body. Same geometry as /csoai-icon.svg so the header,
                the favicon and the schema.org logo cannot drift apart. */}
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label="Council of AI">
                <path d="M50 4 L91 19 V49 C91 74 50 96 50 96 C50 96 9 74 9 49 V19 Z" fill="#04624a"/>
                <path d="M50 12 L84 24 V49 C84 69 50 88 50 88 C50 88 16 69 16 49 V24 Z" fill="#ffffff"/>
                <rect x="26" y="66" width="48" height="6" fill="#04624a"/>
                <rect x="30" y="61" width="40" height="4" fill="#04624a"/>
                <rect x="33" y="38" width="6" height="22" fill="#04624a"/>
                <rect x="44" y="38" width="6" height="22" fill="#04624a"/>
                <rect x="55" y="38" width="6" height="22" fill="#04624a"/>
                <rect x="66" y="38" width="6" height="22" fill="#04624a"/>
                <rect x="28" y="33" width="44" height="5" fill="#04624a"/>
                <path d="M50 20 L75 32 H25 Z" fill="#04624a"/>
              </svg>
            </div>
            <span className="text-xl 2xl:text-2xl font-bold text-emerald-700 tracking-tight whitespace-nowrap">Council of AI</span>
          </a>

          {/* Desktop Navigation — xl breakpoint: below 1280px the mega menu
              cannot fit without mid-word wrapping, so the mobile menu takes over. */}
          <div className="hidden xl:flex items-center" ref={dropdownRef}>
            <div className="flex items-center gap-1 2xl:gap-3">
              {HOME_NAV.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive(item.href)
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-muted-foreground hover:text-emerald-700 hover:bg-muted'
                  }`}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Right Side Actions — flex-nowrap + shrink-0 prevents vertical-letter collapse on 1280-1400px viewports */}
          <div className="hidden xl:flex flex-nowrap items-center gap-2 2xl:gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground/80 hover:bg-muted transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <a
              href="/os"
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
              title="Council OS — no account"
            >
              OS (no account)
            </a>

            {/* "Verify a card" removed from the header 2026-08-21 (owner call): the
                verify path is already the primary CTA in the hero and in three bands
                below it, so a fourth copy in the chrome was competing with the nav,
                not helping. The route is unchanged and still linked from Measure. */}

            {user ? (
              <>
                <NotificationCenter />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9 rounded-full bg-emerald-50 hover:bg-emerald-100">
                      <User className="h-4 w-4 text-emerald-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/dashboard" className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/my-courses" className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        My Courses
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/certificates" className="flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        My Certificates
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/settings" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-border max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-1">
              {HOME_NAV.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg font-medium ${
                    isActive(item.href) ? 'text-emerald-700 bg-emerald-50' : 'text-foreground/80'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}

              <div className="pt-4 mt-4 border-t border-border space-y-2 px-4">
                <a href="/os" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800">OS (no account)</Button>
                </a>
                <a href="/library" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Browse the full Library</Button>
                </a>
                {user ? (
                  <>
                    <a href="/dashboard" className="block">
                      <Button variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600"
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
