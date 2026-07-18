/**
 * Unified Header Component with Mega Menu
 * Professional navigation with CSOAI branding and comprehensive dropdown menus
 * Enhanced with WCAG AA accessibility features
 */

import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, ChevronDown, Search } from 'lucide-react';
import { NotificationCenter } from '@/pages/NotificationCenter';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import { generateUniqueId, handleArrowNavigation } from '@/lib/accessibility';

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const navButtonRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Generate unique IDs for accessibility
  const menuIds = useRef<Record<string, string>>({});
  const getMenuId = (name: string) => {
    if (!menuIds.current[name]) {
      menuIds.current[name] = generateUniqueId(`menu-${name.toLowerCase()}`);
    }
    return menuIds.current[name];
  };

  const navigation = [
    {
      name: 'Charter',
      href: '/charter',
      submenu: [
        { name: 'Partnership Charter', href: '/charter', description: '52 Articles defining AI safety governance' },
        { name: 'The Maternal Covenant', href: '/charter#maternal', description: 'Care-based AI safety paradigm' },
        { name: 'Prosperity Fund', href: '/prosperity', description: 'AI wealth redistribution & UBI' },
        { name: 'Byzantine Council', href: '/byzantine', description: '33-agent monitoring system' },
        { name: 'Founding Members', href: '/founding-members', description: 'Join the first 100 members' },
      ]
    },
    {
      name: 'Training',
      href: '/training',
      submenu: [
        { name: 'All Courses', href: '/courses', description: 'Browse our complete course catalog' },
        { name: 'My Courses', href: '/my-courses', description: 'Your enrolled courses and progress' },
        { name: 'EU AI Act', href: '/courses?framework=eu', description: 'European AI regulation training' },
        { name: 'NIST AI RMF', href: '/courses?framework=nist', description: 'US AI risk management framework' },
        { name: 'ISO 42001', href: '/courses?framework=iso', description: 'International AI management system' },
      ]
    },
    {
      name: 'Certification',
      href: '/certification',
      submenu: [
        { name: 'Overview', href: '/certification', description: 'Learn about certification' },
        { name: 'Take Exam', href: '/certification/exam', description: 'Start your certification exam' },
        { name: 'My Certificates', href: '/certificates', description: 'View your earned certificates' },
        { name: 'Verify Certificate', href: '/verify-certificate', description: 'Verify a certificate' },
      ]
    },
    {
      name: 'SOAI-PDCA',
      href: '/soai-pdca',
      submenu: [
        { name: 'Framework Overview', href: '/soai-pdca', description: 'Learn about our methodology' },
        { name: 'PDCA Simulator', href: '/pdca-simulator', description: 'Interactive PDCA walkthrough' },
        { name: '33-Agent Council', href: '/agent-council', description: 'Byzantine consensus system' },
        { name: 'Templates', href: '/soai-pdca#templates', description: 'Download PDCA templates' },
      ]
    },
    {
      name: 'Watchdog',
      href: '/public-watchdog',
      submenu: [
        { name: 'Public Watchdog', href: '/public-watchdog', description: 'Crowdsourced AI incident monitoring' },
        { name: 'Report Incident', href: '/watchdog', description: 'Submit AI safety incident' },
        { name: 'Analyst Jobs', href: '/jobs', description: 'Browse analyst opportunities' },
        { name: 'My Applications', href: '/my-applications', description: 'Track your job applications' },
        { name: 'Leaderboard', href: '/leaderboard', description: 'Top performing analysts' },
      ]
    },
    {
      name: 'Enterprise',
      href: '/enterprise',
      submenu: [
        { name: 'Overview', href: '/enterprise', description: 'Enterprise solutions' },
        { name: 'Enterprise Dashboard', href: '/enterprise-dashboard', description: 'CISO compliance hub' },
        { name: 'Pricing', href: '/pricing', description: 'Plans and pricing' },
        { name: 'API Documentation', href: '/api-docs', description: 'Developer resources' },
        { name: 'Compliance Dashboard', href: '/compliance', description: 'Monitor AI compliance' },
      ]
    },
    {
      name: 'Government',
      href: '/government',
      submenu: [
        { name: 'Regulator Dashboard', href: '/government', description: 'Real-time compliance monitoring' },
        { name: 'EU AI Act Status', href: '/government?framework=eu-ai-act', description: 'European compliance' },
        { name: 'NIST AI RMF', href: '/government?framework=nist', description: 'US framework compliance' },
        { name: 'Transparency Portal', href: '/transparency', description: 'Public transparency data' },
      ]
    },
    {
      name: 'Resources',
      href: '/resources',
      submenu: [
        { name: 'About CSOAI', href: '/about', description: 'Our mission and story' },
        { name: 'Accreditation', href: '/accreditation', description: 'Official recognition' },
        { name: 'Standards', href: '/standards', description: 'Frameworks we support' },
        { name: 'Knowledge Base', href: '/knowledge-base', description: 'RLMAI learning system' },
        { name: 'Blog', href: '/blog', description: 'News and insights' },
      ]
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  // Enhanced keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, itemName: string, submenu?: typeof navigation[0]['submenu']) => {
    const submenuLength = submenu?.length || 0;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setActiveDropdown(null);
        setFocusedItemIndex(-1);
        // Return focus to the trigger button
        const triggerIndex = navigation.findIndex(item => item.name === itemName);
        navButtonRefs.current[triggerIndex]?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!activeDropdown && submenuLength > 0) {
          // Open dropdown and focus first item
          setActiveDropdown(itemName);
          setFocusedItemIndex(0);
          setTimeout(() => menuItemsRef.current[0]?.focus(), 0);
        } else if (activeDropdown === itemName) {
          // Move to next item in dropdown
          setFocusedItemIndex((prev) => {
            const next = prev + 1;
            if (next < submenuLength) {
              setTimeout(() => menuItemsRef.current[next]?.focus(), 0);
              return next;
            }
            return prev;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (activeDropdown === itemName) {
          setFocusedItemIndex((prev) => {
            const next = prev - 1;
            if (next >= 0) {
              setTimeout(() => menuItemsRef.current[next]?.focus(), 0);
              return next;
            }
            // Close dropdown if at top
            setActiveDropdown(null);
            const triggerIdx = navigation.findIndex(item => item.name === itemName);
            navButtonRefs.current[triggerIdx]?.focus();
            return -1;
          });
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        // Move to previous top-level nav item
        const currentIdx = navigation.findIndex(item => item.name === itemName);
        if (currentIdx > 0) {
          setActiveDropdown(null);
          setFocusedItemIndex(-1);
          navButtonRefs.current[currentIdx - 1]?.focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        // Move to next top-level nav item
        const currIdx = navigation.findIndex(item => item.name === itemName);
        if (currIdx < navigation.length - 1) {
          setActiveDropdown(null);
          setFocusedItemIndex(-1);
          navButtonRefs.current[currIdx + 1]?.focus();
        }
        break;
      case 'Tab':
        // Close dropdown on tab
        setActiveDropdown(null);
        setFocusedItemIndex(-1);
        break;
      case 'Enter':
      case ' ':
        // If on a submenu item, follow the link
        if (activeDropdown && focusedItemIndex >= 0) {
          // Let the link handle navigation
        } else if (!activeDropdown && submenuLength > 0) {
          // Open dropdown
          e.preventDefault();
          setActiveDropdown(itemName);
          setFocusedItemIndex(0);
          setTimeout(() => menuItemsRef.current[0]?.focus(), 0);
        }
        break;
      case 'Home':
        if (activeDropdown === itemName) {
          e.preventDefault();
          setFocusedItemIndex(0);
          setTimeout(() => menuItemsRef.current[0]?.focus(), 0);
        }
        break;
      case 'End':
        if (activeDropdown === itemName) {
          e.preventDefault();
          const lastIdx = submenuLength - 1;
          setFocusedItemIndex(lastIdx);
          setTimeout(() => menuItemsRef.current[lastIdx]?.focus(), 0);
        }
        break;
    }
  }, [activeDropdown, focusedItemIndex, navigation]);

  // Handle mobile menu keyboard navigation
  const handleMobileMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
      mobileMenuButtonRef.current?.focus();
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setFocusedItemIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset focused item when dropdown changes
  useEffect(() => {
    if (!activeDropdown) {
      setFocusedItemIndex(-1);
      menuItemsRef.current = [];
    }
  }, [activeDropdown]);

  // Handle focus trap for mobile menu
  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      // Focus the first focusable element in mobile menu
      const firstFocusable = mobileMenuRef.current.querySelector<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      firstFocusable?.focus();
    }
  }, [mobileMenuOpen]);

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white border-b border-gray-200"
      role="banner"
    >
      <nav
        id="navigation"
        className="container mx-auto px-4 sm:px-6 lg:px-8"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
            aria-label="CSOAI - Home"
          >
            <img
              src="/csoai-icon.svg.png"
              alt=""
              className="h-10 w-10"
              aria-hidden="true"
            />
            <span className="text-2xl font-bold text-slate-900">CSOAI</span>
          </a>

          {/* Desktop Navigation with Mega Menu */}
          <div className="hidden lg:flex items-center space-x-1" role="menubar">
            <a
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                location === '/'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
              }`}
              aria-current={location === '/' ? 'page' : undefined}
              role="menuitem"
            >
              Home
            </a>

            {navigation.map((item, navIndex) => (
              <div
                key={item.name}
                ref={activeDropdown === item.name ? dropdownRef : null}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
                role="none"
              >
                <a
                  href={item.href}
                  ref={(el) => { navButtonRefs.current[navIndex] = el; }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                    isActive(item.href)
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                  aria-expanded={activeDropdown === item.name}
                  aria-haspopup="menu"
                  aria-controls={getMenuId(item.name)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  role="menuitem"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, item.name, item.submenu)}
                  onClick={(e) => {
                    if (activeDropdown === item.name) {
                      e.preventDefault();
                      setActiveDropdown(null);
                    } else {
                      setActiveDropdown(item.name);
                    }
                  }}
                  onFocus={() => {
                    // Open dropdown on focus for keyboard users
                    setActiveDropdown(item.name);
                  }}
                >
                  {item.name}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      activeDropdown === item.name ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </a>

                {/* Mega Menu Dropdown */}
                {activeDropdown === item.name && item.submenu && (
                  <div
                    id={getMenuId(item.name)}
                    className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    role="menu"
                    aria-label={`${item.name} submenu`}
                    aria-orientation="vertical"
                    onKeyDown={(e) => handleKeyDown(e, item.name, item.submenu)}
                  >
                    {item.submenu.map((subItem, idx) => (
                      <a
                        key={subItem.name}
                        href={subItem.href}
                        ref={(el) => { menuItemsRef.current[idx] = el; }}
                        className={`block px-4 py-3 hover:bg-gray-50 transition-colors focus:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${
                          focusedItemIndex === idx ? 'bg-emerald-50' : ''
                        }`}
                        role="menuitem"
                        tabIndex={activeDropdown === item.name ? 0 : -1}
                        aria-current={location === subItem.href ? 'page' : undefined}
                      >
                        <div className="font-medium text-gray-900 text-sm">{subItem.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5" aria-hidden="true">{subItem.description}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-4" role="group" aria-label="User actions">
            {/* Global Search Trigger */}
            <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />

            {user ? (
              <>
                <NotificationCenter />
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700"
                    aria-label="Go to Dashboard"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Dashboard
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-700"
                      aria-label={`User menu for ${user.name || user.email}`}
                      aria-haspopup="menu"
                    >
                      <User className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-courses">
                        <a className="flex items-center w-full">
                          <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
                          My Courses
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/progress">
                        <a className="flex items-center w-full">
                          <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                          My Progress
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <a className="flex items-center w-full">
                          <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                          Settings
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-600"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700"
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    aria-label="Create a new account"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Search & Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Mobile Search Button */}
            <button
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              type="button"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Mobile Menu Button */}
            <button
              ref={mobileMenuButtonRef}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              type="button"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            ref={mobileMenuRef}
            className="lg:hidden py-4 border-t border-gray-200"
            role="menu"
            aria-label="Mobile navigation"
            onKeyDown={handleMobileMenuKeyDown}
          >
            <div className="flex flex-col space-y-2">
              <a
                href="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                  location === '/'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={location === '/' ? 'page' : undefined}
                role="menuitem"
              >
                Home
              </a>

              {navigation.map((item) => (
                <div key={item.name} role="none">
                  <a
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                      isActive(item.href)
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    role="menuitem"
                  >
                    {item.name}
                  </a>
                  {item.submenu && (
                    <div className="ml-4 mt-1 space-y-1" role="group" aria-label={`${item.name} submenu`}>
                      {item.submenu.map((subItem) => (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-4 py-2 text-xs text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                          onClick={() => setMobileMenuOpen(false)}
                          role="menuitem"
                          aria-current={location === subItem.href ? 'page' : undefined}
                        >
                          {subItem.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200 space-y-2" role="group" aria-label="User actions">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-700"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Go to Dashboard"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/my-courses">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-700"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="View My Courses"
                      >
                        <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
                        My Courses
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-700"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Go to Settings"
                      >
                        <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                        Settings
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      aria-label="Sign out of your account"
                    >
                      <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Sign in to your account"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Create a new account"
                      >
                        Get Started
                      </Button>
                    </Link>
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
