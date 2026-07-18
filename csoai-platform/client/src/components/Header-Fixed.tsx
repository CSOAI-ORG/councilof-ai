/**
 * FIXED Header Component - Streamlined Navigation
 * Fixes cramped menu issues by consolidating navigation items
 * Enhanced responsive design with better spacing
 */

import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, ChevronDown, Search, Shield, GraduationCap, Building2, Eye } from 'lucide-react';
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
import { generateUniqueId } from '@/lib/accessibility';

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

  // STREAMLINED NAVIGATION - Reduced from 8 to 4 main items
  const navigation = [
    {
      name: 'Learn',
      href: '/training',
      icon: GraduationCap,
      submenu: [
        { name: 'All Courses', href: '/courses', description: 'Browse our complete course catalog' },
        { name: 'My Learning', href: '/my-courses', description: 'Your enrolled courses and progress' },
        { name: 'EU AI Act Training', href: '/courses?framework=eu', description: 'European AI regulation course' },
        { name: 'NIST AI RMF', href: '/courses?framework=nist', description: 'US AI risk management framework' },
        { name: 'ISO 42001', href: '/courses?framework=iso', description: 'International AI management system' },
        { name: 'Get Certified', href: '/certification', description: 'Professional certification programs' },
        { name: 'CSOAI Charter', href: '/charter', description: '52 Articles of AI safety governance' },
      ]
    },
    {
      name: 'Comply',
      href: '/compliance',
      icon: Shield,
      submenu: [
        { name: 'Compliance Dashboard', href: '/compliance', description: 'Monitor your AI compliance status' },
        { name: 'SOAI-PDCA Framework', href: '/soai-pdca', description: 'Our methodology for AI safety' },
        { name: 'Enterprise Solutions', href: '/enterprise', description: 'For large organizations' },
        { name: 'Government Portal', href: '/government', description: 'Real-time compliance monitoring' },
        { name: 'API Documentation', href: '/api-docs', description: 'Developer integration guides' },
        { name: 'Standards Overview', href: '/standards', description: 'Frameworks we support' },
      ]
    },
    {
      name: 'Monitor',
      href: '/public-watchdog',
      icon: Eye,
      submenu: [
        { name: 'Public Watchdog', href: '/public-watchdog', description: 'Crowdsourced AI incident monitoring' },
        { name: 'Report Incident', href: '/watchdog', description: 'Submit AI safety incident report' },
        { name: '33-Agent Council', href: '/agent-council', description: 'Byzantine consensus monitoring system' },
        { name: 'Analyst Leaderboard', href: '/leaderboard', description: 'Top performing safety analysts' },
        { name: 'Safety Jobs', href: '/jobs', description: 'Browse analyst opportunities' },
        { name: 'Transparency Portal', href: '/transparency', description: 'Public transparency and reporting' },
      ]
    },
    {
      name: 'Resources',
      href: '/about',
      icon: Building2,
      submenu: [
        { name: 'About CSOAI', href: '/about', description: 'Our mission and story' },
        { name: 'Knowledge Base', href: '/knowledge-base', description: 'RLMAI learning system' },
        { name: 'Blog & News', href: '/blog', description: 'Latest insights and updates' },
        { name: 'Accreditation', href: '/accreditation', description: 'Official recognition and partnerships' },
        { name: 'Founding Members', href: '/founding-members', description: 'Join the first 100 members' },
        { name: 'Pricing', href: '/pricing', description: 'Plans and pricing information' },
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
        const triggerIndex = navigation.findIndex(item => item.name === itemName);
        navButtonRefs.current[triggerIndex]?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!activeDropdown && submenuLength > 0) {
          setActiveDropdown(itemName);
          setFocusedItemIndex(0);
          setTimeout(() => menuItemsRef.current[0]?.focus(), 0);
        } else if (activeDropdown === itemName) {
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
            setActiveDropdown(null);
            const triggerIdx = navigation.findIndex(item => item.name === itemName);
            navButtonRefs.current[triggerIdx]?.focus();
            return -1;
          });
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const currentIdx = navigation.findIndex(item => item.name === itemName);
        if (currentIdx > 0) {
          setActiveDropdown(null);
          setFocusedItemIndex(-1);
          navButtonRefs.current[currentIdx - 1]?.focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        const currIdx = navigation.findIndex(item => item.name === itemName);
        if (currIdx < navigation.length - 1) {
          setActiveDropdown(null);
          setFocusedItemIndex(-1);
          navButtonRefs.current[currIdx + 1]?.focus();
        }
        break;
      case 'Tab':
        setActiveDropdown(null);
        setFocusedItemIndex(-1);
        break;
      case 'Enter':
      case ' ':
        if (activeDropdown && focusedItemIndex >= 0) {
          // Let the link handle navigation
        } else if (!activeDropdown && submenuLength > 0) {
          e.preventDefault();
          setActiveDropdown(itemName);
          setFocusedItemIndex(0);
          setTimeout(() => menuItemsRef.current[0]?.focus(), 0);
        }
        break;
    }
  }, [activeDropdown, focusedItemIndex, navigation]);

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

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
      role="banner"
    >
      <nav
        className="container mx-auto px-4 sm:px-6 lg:px-8"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16">
          {/* Logo - More compact */}
          <Link href="/">
            <a className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg p-1">
              <img
                src="/csoai-icon.svg.png"
                alt=""
                className="h-8 w-8"
                aria-hidden="true"
              />
              <span className="text-xl font-bold text-slate-900">CSOAI</span>
            </a>
          </Link>

          {/* Desktop Navigation - STREAMLINED */}
          <div className="hidden lg:flex items-center space-x-2" role="menubar">
            <Link href="/">
              <a
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
            </Link>

            {navigation.map((item, navIndex) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.name}
                  ref={activeDropdown === item.name ? dropdownRef : null}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                  role="none"
                >
                  <Link href={item.href}>
                    <a
                      ref={(el) => { navButtonRefs.current[navIndex] = el; }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                        isActive(item.href)
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                      }`}
                      aria-expanded={activeDropdown === item.name}
                      aria-haspopup="menu"
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
                      onFocus={() => setActiveDropdown(item.name)}
                    >
                      <IconComponent className="h-4 w-4" aria-hidden="true" />
                      {item.name}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform duration-200 ${
                          activeDropdown === item.name ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </a>
                  </Link>

                  {/* Improved Mega Menu Dropdown */}
                  {activeDropdown === item.name && item.submenu && (
                    <div
                      className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-50 animate-in fade-in slide-in-from-top-1"
                      role="menu"
                      aria-label={`${item.name} submenu`}
                      onKeyDown={(e) => handleKeyDown(e, item.name, item.submenu)}
                    >
                      {item.submenu.map((subItem, idx) => (
                        <Link key={subItem.name} href={subItem.href}>
                          <a
                            ref={(el) => { menuItemsRef.current[idx] = el; }}
                            className={`block px-4 py-3 hover:bg-gray-50 transition-colors focus:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 border-l-2 border-transparent hover:border-emerald-500 ${
                              focusedItemIndex === idx ? 'bg-emerald-50 border-emerald-500' : ''
                            }`}
                            role="menuitem"
                            tabIndex={activeDropdown === item.name ? 0 : -1}
                            aria-current={location === subItem.href ? 'page' : undefined}
                          >
                            <div className="font-medium text-gray-900 text-sm">{subItem.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5 leading-relaxed" aria-hidden="true">{subItem.description}</div>
                          </a>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Side Actions - More compact */}
          <div className="hidden lg:flex items-center space-x-3" role="group" aria-label="User actions">
            {/* Global Search */}
            <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />

            {user ? (
              <>
                <NotificationCenter />
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 px-3"
                    aria-label="Go to Dashboard"
                  >
                    <BarChart3 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Dashboard
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-700 px-3"
                      aria-label={`User menu for ${user.name || user.email}`}
                      aria-haspopup="menu"
                    >
                      <User className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      <span className="max-w-[100px] truncate text-sm">{user.name || user.email}</span>
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
                    className="text-gray-700 px-4"
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                    aria-label="Create a new account"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              type="button"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
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

        {/* Improved Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col space-y-1">
              <Link href="/">
                <a
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location === '/'
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </a>
              </Link>

              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.name}>
                    <Link href={item.href}>
                      <a
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <IconComponent className="h-4 w-4" aria-hidden="true" />
                        {item.name}
                      </a>
                    </Link>
                    {item.submenu && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link key={subItem.name} href={subItem.href}>
                            <a
                              className="block px-4 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {subItem.name}
                            </a>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-4 mt-4 border-t border-gray-200 space-y-1">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
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
                    >
                      <LogOut className="h-4 w-4 mr-2" />
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
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setMobileMenuOpen(false)}
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

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}