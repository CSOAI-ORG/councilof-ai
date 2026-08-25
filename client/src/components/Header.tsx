/**
 * Master Header Component with Professional Mega Menu
 * Clean, modern navigation with CSOAI branding
 */

import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, ChevronDown, Search, GraduationCap, Award, Building2, Landmark, Globe2, BookMarked, ShieldCheck, BarChart2 } from 'lucide-react';
import { NotificationCenter } from '@/pages/NotificationCenter';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteChromeHidden } from '@/lib/osChrome';
import { lobbyHref, openLobby } from '@/lib/lobbyLink';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlobalSearch, GlobalSearchTrigger } from '@/components/GlobalSearch';

// ---------------------------------------------------------------------------
// MASTER NAVIGATION — the lean canonical IA (site-alignment pass, 2026-08-20).
//
// Six groups only. The primary nav points at CURRENT pages exclusively; everything
// else stays reachable through the footer Library (/library), where it is dated,
// sector-organized and marked with the ArchivedBanner. "Library, don't delete."
//
// Every route below was verified against App.tsx before being linked. Items flagged
// `external` are machine surfaces (live JSON, did:web) — they open in a new tab and
// are deliberately in the nav because the site serves agents (A2A) as well as humans.
// ---------------------------------------------------------------------------

interface NavItem { name: string; href: string; description: string; external?: boolean }
interface NavGroup { name: string; href: string; icon: typeof Globe2; description: string; submenu: NavItem[] }

const navigation: NavGroup[] = [
  {
    name: 'Measure',
    href: '/gspc-scoreboard',
    icon: BarChart2,
    description: 'The instrument and its board',
    submenu: [
      { name: 'The GSPC board', href: '/gspc-scoreboard', description: 'The living board — measured axes, empty cells empty. Counts from GET /api/gspc' },
      { name: 'Financial axes', href: '/financial-axes', description: 'The 8 financial slots of the 22-axis canon — provenance-controls measured, the rest UNMEASURED and honest' },
      { name: 'Measured models', href: '/models', description: 'Ranked by signed GSPC scores, not tokens' },
      { name: 'Published tools', href: '/tools', description: 'MCP you can run — not a marketplace' },
      { name: 'Measured results', href: '/benchmarks', description: 'Every number traces to a published artefact, losses included' },
      { name: 'The arena', href: '/gspc-arena', description: 'Head-to-head, deterministic grading, no model judging another' },
      { name: 'Verify a signed card', href: '/gspc-verify', description: 'Check any Ed25519-signed record offline against the published key' },
      { name: 'Free signed assessment', href: '/assess', description: 'Measure your own system and get a signed record back' },
      { name: 'First-Fine Watch', href: '/first-fine-watch', description: 'Signed enforcement record — EU AI Act fines + deadlines (R8 free)' },
      { name: 'EUNOMIA board', href: '/eunomia', description: 'Financial-verification axes — signed, 2-tier (0.5b + 7b)' },
      { name: 'Sectors', href: '/sectors', description: 'White-label tooling for regulator / insurer / bond / cobol / vendor' },
      { name: 'EUNOMIA data', href: '/eunomia-data', description: 'Commercial x402 data rail — data-only, never scores' },
      { name: 'Registers', href: '/registers', description: 'Signed financial-axis register — a stranger re-derives every row (CAT F6)' },
      { name: 'Methodology', href: '/methodology', description: 'Gold labels, n≥30, and how to recompute every number yourself' },
      { name: 'The GSPC instrument', href: '/instrument', description: 'Four deterministic lenses over frozen provisions — no model in the verdict' },
    ],
  },
  {
    name: 'Regulation',
    href: '/eu-ai-act',
    icon: Landmark,
    description: 'The statute we measure against',
    submenu: [
      { name: 'EU AI Act — the guide', href: '/eu-ai-act', description: 'The whole Act, phased, with the Digital Omnibus amendments' },
      { name: 'Article 50 — transparency', href: '/article-50', description: 'Live since 2 Aug 2026; marking grace ends 2 Dec 2026' },
      { name: 'Dates and deadlines', href: '/ai-act-timeline', description: 'What applies when — Annex III deferred to 2 Dec 2027' },
      { name: 'GPAI model duties', href: '/gpai', description: 'Documentation, training-data summary, copyright' },
      { name: 'Readiness checklist', href: '/checklist', description: 'Work through the duties that are actually in force' },
      { name: 'Global regulation tracker', href: '/regulation-tracker', description: 'Every AI regime worldwide, with its current dates' },
      { name: 'Regulator atlas', href: '/regulators', description: 'Who supervises what, jurisdiction by jurisdiction' },
      { name: 'Framework crosswalk', href: '/crosswalk', description: 'Map existing ISO 42001 / NIST controls onto Act duties' },
      { name: 'Regulation feed — live JSON', href: '/api/regulation', description: 'The machine-readable corpus feed', external: true },
    ],
  },
  {
    name: 'Solutions',
    href: '/?lobby=measured&task=enterprise-start',
    icon: Building2,
    description: 'Who the measurement is for',
    submenu: [
      { name: 'Products', href: '/products', description: 'The signed-evidence products — verify is free, a grade is never sold, no public prices' },
      { name: 'GPAI Evidence Pack', href: '/gpai-evidence', description: 'Signed measurement a GPAI provider can hand the AI Office — evidence, never a conformity mark' },
      { name: 'CRA Readiness Kit', href: '/cra-readiness', description: 'The 24h/72h/14-day ENISA runbook + signed SBOM workflow — template and tooling, not legal advice' },
      { name: 'Enterprise', href: '/?lobby=measured&task=enterprise-start', description: 'Measure a portfolio of systems against the duties that bind them' },
      { name: 'Insurers and underwriters', href: '/insurers', description: 'Signed evidence a risk model can actually price' },
      { name: 'Government and regulators', href: '/government', description: 'Independent measurement, published method, no conformity mark' },
      { name: 'Industries', href: '/industries', description: 'Sector-by-sector: what applies to you and when' },
      { name: 'How the free rail works', href: '/?lobby=measured&task=pricing-overview', description: 'Verify is free. A grade is never sold. No public prices.' },
      { name: 'Integrations', href: '/integrations', description: 'Wire the measurement into the tools you already run' },
      { name: 'Embed / white-label', href: '/embed', description: 'Drop a signed, self-verifying measurement into your own site — verify is free forever' },
    ],
  },
  {
    name: 'Evidence',
    href: '/honesty',
    icon: ShieldCheck,
    description: 'Our receipts, including the losses',
    submenu: [
      { name: 'The honesty gate', href: '/honesty', description: 'What we cannot yet measure, published rather than hidden' },
      { name: 'Attestation on the ledger', href: '/xrpl-attest', description: 'Signed evidence attached to a public ledger about accounts we do not control — permissionless attach, never a rating' },
      { name: 'Distribution integrity', href: '/distribution-integrity', description: 'Represented is not distributed — the tokenized-RWA committed-vs-distributed spread as a declared financial axis, coverage-first and UNMEASURED' },
      { name: 'Refutation Ledger', href: '/refutation-ledger', description: 'Experiments that killed our own theses — with artefacts' },
      { name: 'Firewall Charter', href: '/firewall-charter', description: 'We measure; we never fix what we measure' },
      { name: 'Corrections — live JSON', href: '/api/corrections', description: 'Corrections published, never silently edited', external: true },
      { name: 'GSPC board — live JSON', href: '/api/gspc', description: 'The board as an agent reads it', external: true },
      { name: 'did:web trust root', href: '/.well-known/did.json', description: 'The published signer — verify a card without us', external: true },
      { name: 'API documentation', href: '/api-docs', description: 'Everything above, documented for agents' },
      { name: 'System status', href: '/status', description: 'What is up, what is degraded' },
    ],
  },
  {
    name: 'Academy',
    href: '/academy',
    icon: GraduationCap,
    description: 'Training — not conformity',
    submenu: [
      { name: 'Council Academy', href: '/academy', description: 'Learn the statute and the method' },
      { name: 'All courses', href: '/academy', description: 'Learn the statute and the method. We do not certify.' },
      { name: 'Training overview', href: '/academy', description: 'How the free training rail works. We certify nothing.' },
      { name: 'Verify a training record', href: '/gspc-verify', description: 'Check a signed record. Verify is free forever.' },
      { name: 'What a course attests', href: '/academy', description: 'Course completion attests training, not conformity' },
    ],
  },
  {
    name: 'Company',
    href: '/about',
    icon: BookMarked,
    description: 'Council of AI — CSOAI Ltd',
    submenu: [
      { name: 'About', href: '/about', description: 'An independent measurement instrument, and what that excludes' },
      { name: 'The Library — full archive', href: '/library', description: "Everything we have published, dated and organized by sector" },
      { name: 'Blog', href: '/blog', description: 'Findings, corrections and notes' },
      { name: 'Trust Center', href: '/trust-center', description: 'Security posture — and the certifications we have NOT been awarded' },
      { name: 'Contact', href: '/contact', description: 'CSOAI Ltd, UK company 16939677' },
      { name: 'Legal and disclaimers', href: '/disclaimers', description: 'What this measurement is not' },
    ],
  },
];

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideChrome = useSiteChromeHidden();

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
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

  if (hideChrome) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
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
            <span className="text-xl 2xl:text-2xl font-bold text-emerald-700 tracking-tight whitespace-nowrap">CSOAI</span>
          </a>

          {/* Desktop Navigation — xl breakpoint: below 1280px the mega menu
              cannot fit without mid-word wrapping, so the mobile menu takes over. */}
          <div className="hidden xl:flex items-center" ref={dropdownRef}>
            <div className="flex items-center gap-1 2xl:gap-3">
              {/* Home Link */}
              <a
                href="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  location === '/'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
                }`}
              >
                Home
              </a>

              {/* Main Nav Items */}
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className={`px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                      isActive(item.href) || activeDropdown === item.name
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                  >
                    {item.name}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {activeDropdown === item.name && (
                    <div
                      className="absolute left-0 top-full pt-2 z-50"
                      onMouseEnter={() => handleMouseEnter(item.name)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-5 w-5 text-emerald-600" />
                            <div>
                              <div className="font-semibold text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </div>
                        </div>
                        {/* Menu Items */}
                        <div className="py-2">
                          {item.submenu.map((subItem) => (
                            <a
                              key={subItem.name}
                              href={subItem.href}
                              target={subItem.external ? '_blank' : undefined}
                              rel={subItem.external ? 'noreferrer' : undefined}
                              className="block px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="font-medium text-gray-800 group-hover:text-emerald-700 text-sm">
                                {subItem.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {subItem.description}
                              </div>
                            </a>
                          ))}
                        </div>
                        {/* Footer Link */}
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                          <a
                            href={item.href}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            onClick={() => setActiveDropdown(null)}
                          >
                            View all {item.name.toLowerCase()} &rarr;
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Actions — flex-nowrap + shrink-0 prevents vertical-letter collapse on 1280-1400px viewports */}
          <div className="hidden xl:flex flex-nowrap items-center gap-2 2xl:gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <a
              href={lobbyHref({ pane: 'home' })}
              onClick={(e) => { e.preventDefault(); openLobby({ pane: 'home' }); }}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
              title="Chat is Council OS — the AG UI"
            >
              Chat
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
                    <Button variant="ghost" size="icon" className="text-gray-600 h-9 w-9 rounded-full bg-emerald-50 hover:bg-emerald-100">
                      <User className="h-4 w-4 text-emerald-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
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
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/start">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                    Start free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-gray-100 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-1">
              <a
                href="/"
                className={`block px-4 py-3 rounded-lg font-medium ${
                  location === '/' ? 'text-emerald-700 bg-emerald-50' : 'text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href={lobbyHref({ pane: 'home' })}
                className="block px-4 py-3 rounded-lg font-medium text-emerald-800 bg-emerald-50"
                onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); openLobby({ pane: 'home' }); }}
                title="Chat is Council OS — the AG UI"
              >
                Chat
              </a>

              {navigation.map((item) => (
                <div key={item.name} className="space-y-1">
                  <a
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                      isActive(item.href) ? 'text-emerald-700 bg-emerald-50' : 'text-gray-700'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 text-emerald-600" />
                    {item.name}
                  </a>
                  <div className="ml-12 space-y-1">
                    {item.submenu.map((subItem) => (
                      <a
                        key={subItem.name}
                        href={subItem.href}
                        target={subItem.external ? '_blank' : undefined}
                        rel={subItem.external ? 'noreferrer' : undefined}
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-emerald-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subItem.name}
                        {subItem.external && <span className="ml-1 text-[10px] uppercase tracking-wide text-gray-400">JSON</span>}
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2 px-4">
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
                ) : (
                  <>
                    <a href="/login" className="block">
                      <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                        Sign In
                      </Button>
                    </a>
                    <a href="/start" className="block">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setMobileMenuOpen(false)}>
                        Start free
                      </Button>
                    </a>
                  </>
                )}
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
