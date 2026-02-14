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
    name: 'Charter',
    href: '/charter',
    icon: FileText,
    description: 'Our founding principles',
    submenu: [
      { name: 'Partnership Charter', href: '/charter', description: '52 Articles defining AI safety governance' },
      { name: 'Browse All 52 Articles', href: '/charter#articles', description: 'Individual article deep-dives' },
      { name: 'The Maternal Covenant', href: '/charter#maternal', description: 'Care-based AI safety paradigm' },
      { name: 'Prosperity Fund', href: '/prosperity', description: 'AI wealth redistribution & UBI' },
      { name: 'Byzantine Council', href: '/byzantine', description: '33-agent monitoring system' },
      { name: 'Founding Members', href: '/founding-members', description: 'Join the first 100 members' },
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
      { name: 'SOAI-PDCA Framework', href: '/soai-pdca', description: 'Learn about SOAI-PDCA methodology' },
      { name: 'PDCA Simulator', href: '/pdca-simulator', description: 'Interactive PDCA walkthrough' },
      { name: '33-Agent Council', href: '/agent-council', description: 'Byzantine consensus system' },
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
    name: 'Resources',
    href: '/resources',
    icon: BookMarked,
    description: 'Knowledge & tools',
    submenu: [
      { name: 'FAQ', href: '/faq', description: 'Frequently asked questions' },
      { name: 'AI Glossary', href: '/glossary', description: '60+ governance terms defined' },
      { name: 'Framework Crosswalks', href: '/crosswalks', description: 'Compare EU AI Act, NIST, ISO 42001, TC260' },
      { name: 'Readiness Assessment', href: '/readiness-assessment', description: 'Evaluate your AI governance maturity' },
      { name: 'Partners & Advisory', href: '/partners', description: 'Expert advisory services' },
      { name: 'Case Studies', href: '/case-studies', description: 'Real-world implementations' },
      { name: 'Trust Center', href: '/trust-center', description: 'Security & compliance info' },
      { name: 'Technology', href: '/technology', description: 'Our architecture & Byzantine Council' },
      { name: 'ROI Calculator', href: '/roi-calculator', description: 'Estimate your governance ROI' },
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
            <span className="text-2xl font-bold text-emerald-700 tracking-tight">CSOAI</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center" ref={dropdownRef}>
            <div className="flex items-center gap-1">
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
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
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
          <div className="hidden lg:flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

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
                <Link href="/signup">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
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
          <div className="lg:hidden py-4 border-t border-gray-100 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
                    <a href="/signup" className="block">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setMobileMenuOpen(false)}>
                        Get Started
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
