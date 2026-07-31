/**
 * Master Header Component with Professional Mega Menu
 * Clean, modern navigation with CSOAI branding
 */

import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, ChevronDown, Search, Shield, GraduationCap, Award, Eye, Building2, Landmark, FileText, Globe2, HelpCircle, BookMarked, ClipboardCheck, Factory, Handshake, ShieldCheck, BarChart2 } from 'lucide-react';
import { NotificationCenter } from '@/pages/NotificationCenter';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlobalSearch, GlobalSearchTrigger } from '@/components/GlobalSearch';

// Navigation structure with icons
const navigation = [
  {
    name: "Sovereign OS",
    href: "/sov-space",
    icon: Globe2,
    description: "Your AI OS",
    submenu: [
      { name: "Sov Space", href: "/sov-space", description: "Simulate and govern in real time" },
      { name: "Governance Graph", href: "/graph", description: "The governed Google" },
      { name: "Tool Commons", href: "/tool-commons", description: "370+ governed MCP tools" },
      { name: "Open Commons", href: "/commons", description: "Free Creative Commons media" },
      { name: "Emergence", href: "/emergence", description: "The living egg" },
      { name: "Real-World Globe", href: "/world-3d", description: "Photorealistic 3D Earth" },
      { name: "Start free", href: "/start", description: "Build your own AI" },
      { name: "Plans and Pricing", href: "/plans", description: "Free to Enterprise" },
      { name: "System Status", href: "/status", description: "Live transparency" },
    ],
  },
  // The measurement wing — top-level because the refutation ledger is the moat: the only
  // part of a benchmark a reader can use to calibrate trust in the rest of it. Promoting
  // this from a submenu keeps the J-space chain discoverable to first-time visitors.
  {
    name: "Ledger",
    href: "/refutation-ledger",
    icon: BookOpen,
    description: "The moat, visible",
    submenu: [
      { name: "The Refutation Ledger", href: "/refutation-ledger", description: "8 experiments that killed our own theses — published, with artefacts" },
      { name: "Live Ledger (signed)", href: "/live-ledger", description: "Live D1 queryable decision_records — signed, with supersession trail" },
      { name: "The GSPC Instrument", href: "/instrument", description: "Four deterministic lenses over 417 frozen provisions — no model in the verdict" },
      { name: "Measured Results", href: "/benchmarks", description: "Every number traces to a published artefact, losses included" },
    ],
  },
  {
    name: 'Explore',
    href: '/os',
    icon: Globe2,
    description: 'The agentic governance OS',
    submenu: [
      { name: 'Try the Council', href: '/try', description: '30-second demo: 5 agents reach consensus on your question' },
      // The measurement wing — top-level, because the refutation ledger is the moat: it is the
      // only part of a benchmark a reader can use to calibrate trust in the rest of it.
      { name: 'The GSPC Instrument', href: '/instrument', description: 'Four deterministic lenses over 417 frozen provisions — no model in the verdict' },
      { name: 'The Refutation Ledger', href: '/refutation-ledger', description: '8 experiments that killed our own theses — published, with artefacts' },
      { name: 'Measured Results', href: '/benchmarks', description: 'Every number traces to a published artefact, losses included' },
      { name: 'The Regulator Atlas', href: '/regulators', description: 'Every AI + cyber regime — top tools & next dates' },
      { name: "God's Eye cyber scan", href: '/scan', description: 'Scan your own cyber with open-source; Sovereign fixes it' },
      { name: 'Why CSOAI vs the rest', href: '/why', description: 'What we do that Vanta/Credo/OneTrust don\'t' },
      { name: 'Competitor battlecards', href: '/competitors', description: 'Cited intel on Vanta, Credo AI, OneTrust + our wedge' },
      { name: 'The Sovereign Network', href: '/network', description: '20 signed agents, one council' },
      { name: 'The Hive', href: '/hive', description: 'Every framework, collected — click any one' },
      { name: 'The Sovereign Globe', href: '/globe', description: 'AI governance, layered on the world' },
      { name: 'Framework Temples', href: '/temples', description: 'Each regulation at its real-world seat' },
      { name: 'Relevance Map', href: '/map', description: 'What governs what — bridges, frameworks, gaps' },
      { name: 'Industry Playbooks', href: '/playbooks', description: 'For your sector: frameworks, bridges, steps' },
      { name: 'Sector Atlas', href: '/sectors', description: 'All CASA sectors mapped to frameworks + risk tier' },
      { name: 'AI governance: the guide', href: '/ai-governance', description: 'The complete map — start here' },
      { name: 'Global regulation tracker', href: '/global-ai-regulation', description: 'Every AI regime worldwide, current' },
      { name: 'Framework crosswalk', href: '/crosswalk', description: '13 frameworks × 8 controls — comply once' },
      { name: 'Agent governance', href: '/agent-governance', description: 'Govern AI agents — the agentic era' },
      { name: 'Article 50 countdown', href: '/article-50', description: 'The 2 Aug / 2 Dec transparency cliff' },
      { name: 'Cyber: DORA · NIS2 · CRA', href: '/cra', description: 'The EU cybersecurity stack, crosswalked' },
      { name: 'Free AI assessment', href: '/assess', description: 'Signed readiness assessment — see your gaps in minutes' },
      { name: 'Rediscovered, Not Invented', href: '/lineage', description: 'The 4,000-year governance architecture' },
      { name: 'How It Works', href: '/how', description: 'From question to signed verdict in 5 steps' },
      { name: 'Open the full launcher', href: '/os', description: 'Every app on one grid' },
    ]
  },
  {
    name: 'Learn',
    href: '/courses',
    icon: GraduationCap,
    description: 'Training & certification',
    submenu: [
      { name: 'All Courses', href: '/courses', description: 'Browse our complete course catalog' },
      { name: 'My Learning', href: '/my-courses', description: 'Your enrolled courses and progress' },
      { name: 'EU AI Act', href: '/courses?framework=eu', description: 'European AI regulation training' },
      { name: 'NIST AI RMF', href: '/courses?framework=nist', description: 'US AI risk management framework' },
      { name: 'ISO 42001', href: '/courses?framework=iso', description: 'International AI management system' },
      { name: 'Certification Overview', href: '/certification', description: 'Certification paths and requirements' },
      { name: 'Take Exam', href: '/certification/exam', description: 'Start your certification exam' },
      { name: 'My Certificates', href: '/certificates', description: 'View your earned certificates' },
      { name: 'Verify Certificate', href: '/verify-certificate', description: 'Verify any CSOAI certificate' },
    ]
  },
  {
    name: 'Solutions',
    href: '/enterprise',
    icon: Building2,
    description: 'Enterprise & government',
    submenu: [
      { name: 'Enterprise Overview', href: '/enterprise', description: 'Enterprise solutions overview' },
      { name: 'Industry Solutions', href: '/industry-solutions', description: 'Sector-specific governance' },
      { name: 'Government Dashboard', href: '/government', description: 'Real-time compliance monitoring' },
      { name: 'Global Regulation Tracker', href: '/global-regulations', description: 'AI regulations across 40+ nations' },
      { name: '33-Agent Council', href: '/agent-council', description: 'Byzantine consensus system' },
      { name: 'Command Center', href: '/command-center', description: 'Your whole governance program on one screen' },
      { name: 'AI Policy Generator', href: '/policy-generator', description: 'Generate a board-ready AI policy' },
      { name: 'Risk Heatmap', href: '/risk-heatmap', description: 'Likelihood × impact risk matrix' },
      { name: 'OSCAL Studio', href: '/oscal', description: 'Import/export NIST OSCAL, FedRAMP 20x ready' },
      { name: 'Evidence Hub', href: '/evidence', description: 'Continuous compliance evidence' },
      { name: 'Model Registry', href: '/models', description: 'Model cards and fairness audits' },
      { name: 'Sovereign Town', href: '/sovereign-town', description: 'The signed record of AI governance' },
      { name: 'Pricing', href: '/pricing', description: 'Plans and pricing' },
      { name: 'API Access', href: '/api-docs', description: 'Developer resources' },
    ]
  },
  {
    name: 'Watchdog',
    href: '/public-watchdog',
    icon: Eye,
    description: 'Monitor AI incidents',
    submenu: [
      { name: 'Public Watchdog', href: '/public-watchdog', description: 'Crowdsourced AI incident monitoring' },
      { name: 'Report Incident', href: '/watchdog', description: 'Submit AI safety incident' },
      { name: 'Analyst Jobs', href: '/jobs', description: 'Browse analyst opportunities' },
      { name: 'Leaderboard', href: '/leaderboard', description: 'Top performing analysts' },
    ]
  },
  {
    name: 'Company',
    href: '/charter',
    icon: BookMarked,
    description: 'Charter, knowledge & trust',
    submenu: [
      { name: 'Partnership Charter', href: '/charter', description: '52 Articles defining AI safety governance' },
      { name: 'The Maternal Covenant', href: '/charter#maternal', description: 'Care-based AI safety paradigm' },
      { name: 'Prosperity Fund', href: '/prosperity', description: 'AI wealth redistribution & UBI' },
      { name: 'Founding Members', href: '/founding-members', description: 'Join the first 100 members' },
      { name: 'FAQ', href: '/faq', description: 'Frequently asked questions' },
      { name: 'AI Glossary', href: '/glossary', description: '60+ governance terms defined' },
      { name: 'Framework Crosswalks', href: '/crosswalks', description: 'Compare EU AI Act, NIST, ISO 42001, TC260' },
      { name: 'Readiness Assessment', href: '/readiness-assessment', description: 'Evaluate your AI governance maturity' },
      { name: 'Partners & Advisory', href: '/partners', description: 'Expert advisory services' },
      { name: 'Trust Center', href: '/trust-center', description: 'Security & compliance info' },
      { name: 'Technology', href: '/technology', description: 'Our architecture & Byzantine Council' },
      { name: 'Blog', href: '/blog', description: 'Latest news & insights' },
    ]
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

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            {/* Shield Logo */}
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981"/>
                    <stop offset="100%" stopColor="#047857"/>
                  </linearGradient>
                </defs>
                {/* Shield */}
                <path
                  d="M50 5 L90 20 L90 50 C90 75 50 95 50 95 C50 95 10 75 10 50 L10 20 Z"
                  fill="url(#shieldGradient)"
                />
                {/* Circuit lines */}
                <g stroke="#fff" strokeWidth="3" fill="none" opacity="0.9">
                  <line x1="25" y1="30" x2="25" y2="70"/>
                  <line x1="25" y1="40" x2="40" y2="40"/>
                  <line x1="25" y1="55" x2="35" y2="55"/>
                  <circle cx="25" cy="30" r="4" fill="#fff"/>
                  <circle cx="40" cy="40" r="4" fill="#fff"/>
                  <circle cx="35" cy="55" r="4" fill="#fff"/>
                  <circle cx="25" cy="70" r="4" fill="#fff"/>
                </g>
                {/* Brain curves */}
                <g stroke="#fff" strokeWidth="3" fill="none" opacity="0.9">
                  <path d="M55 35 Q70 30 72 45 Q82 45 78 58 Q85 65 70 72 Q65 80 55 72"/>
                  <circle cx="62" cy="45" r="5" fill="#fff"/>
                  <circle cx="72" cy="60" r="5" fill="#fff"/>
                </g>
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

          {/* Right Side Actions */}
          <div className="hidden xl:flex items-center gap-2 2xl:gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* CSOAI OS launcher — yields its space below 2xl so the nav never wraps */}
            <a
              href="/os"
              className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm transition-all"
            >
              <span className="text-base leading-none">⊞</span> AI OS
            </a>

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
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-emerald-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subItem.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2 px-4">
                <a href="/os" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white">⊞ AI OS</Button>
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
