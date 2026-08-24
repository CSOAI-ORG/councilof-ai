/**
 * Master Header — Council OS / AG-UI workspace menu.
 * Full site map (Measure, Regulation, …) lives in the footer.
 */

import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, ChevronDown, Search, Award } from 'lucide-react';
import { NotificationCenter } from '@/pages/NotificationCenter';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteChromeHidden, useMarketingHeaderHidden } from '@/lib/osChrome';
import { openLobby } from '@/lib/lobbyLink';
import { MASTER_NAVIGATION } from '@/data/masterMenu';
import type { MasterNavAction, MasterNavItem } from '@/data/masterMenu';
import { MegaDropdown, resolveLobbyItem } from '@/components/nav/NavMegaPanel';
import { lobbyHref } from '@/lib/lobbyLink';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlobalSearch } from '@/components/GlobalSearch';
import { POSITIONING } from '@/lib/positioning';

function resolveMasterAction(action: MasterNavAction) {
  if (action.kind === 'lobby') return resolveLobbyItem(action.pane, action.task);
  return { href: action.href, external: action.external };
}

function megaItemsFromMaster(submenu: MasterNavItem[]) {
  return submenu.map((sub) => {
    const resolved = resolveMasterAction(sub.action);
    return {
      name: sub.name,
      description: sub.description,
      href: resolved.href,
      external: 'external' in resolved ? resolved.external : undefined,
      onClick: 'onClick' in resolved ? resolved.onClick : undefined,
    };
  });
}

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideChrome = useSiteChromeHidden();
  const hideMarketing = useMarketingHeaderHidden();

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (hideChrome || hideMarketing) return null;

  const closeMenus = () => setActiveDropdown(null);

  const renderSubLink = (
    sub: MasterNavItem,
    onDone: () => void,
    className: string,
  ) => {
    const resolved = resolveMasterAction(sub.action);
    const external = 'external' in resolved ? resolved.external : undefined;
    const onClick = (e: React.MouseEvent) => {
      if ('onClick' in resolved && resolved.onClick) resolved.onClick(e);
      onDone();
    };
    return (
      <a
        key={sub.name}
        href={resolved.href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className={className}
        onClick={onClick}
      >
        {sub.name}
        {external && (
          <span className="ml-1 text-[10px] uppercase tracking-wide text-gray-400">JSON</span>
        )}
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
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

          <div className="hidden xl:flex items-center" ref={dropdownRef}>
            <div className="flex items-center gap-1 2xl:gap-3">
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

              {MASTER_NAVIGATION.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
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

                  {activeDropdown === item.name && (
                    <div
                      className="absolute left-0 top-full pt-2 z-50"
                      onMouseEnter={() => handleMouseEnter(item.name)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <MegaDropdown
                        groupName={item.name}
                        groupDescription={item.description}
                        icon={item.icon}
                        groupHref={item.groupLobby ? lobbyHref(item.groupLobby) : item.href}
                        groupOnClick={
                          item.groupLobby
                            ? (e) => {
                                e.preventDefault();
                                openLobby(item.groupLobby!);
                              }
                            : undefined
                        }
                        items={megaItemsFromMaster(item.submenu)}
                        onNavigate={closeMenus}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden xl:flex flex-nowrap items-center gap-2 2xl:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => openLobby({ pane: 'home' })}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {POSITIONING.os.cta}
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
                <Link href="/start">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                    Start free
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="xl:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

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
              <button
                type="button"
                className="block w-full text-left px-4 py-3 rounded-lg font-medium text-emerald-800 bg-emerald-50"
                onClick={() => { setMobileMenuOpen(false); openLobby({ pane: 'home' }); }}
              >
                {POSITIONING.os.cta}
              </button>

              {MASTER_NAVIGATION.map((item) => (
                <div key={item.name} className="space-y-1">
                  <a
                    href={item.groupLobby ? lobbyHref(item.groupLobby) : item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                      isActive(item.href) ? 'text-emerald-700 bg-emerald-50' : 'text-gray-700'
                    }`}
                    onClick={(e) => {
                      if (item.groupLobby) {
                        e.preventDefault();
                        openLobby(item.groupLobby);
                      }
                      setMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="h-5 w-5 text-emerald-600" />
                    {item.name}
                  </a>
                  <div className="ml-12 space-y-1">
                    {item.submenu.map((sub) =>
                      renderSubLink(
                        sub,
                        () => setMobileMenuOpen(false),
                        'block px-4 py-2 text-sm text-gray-600 hover:text-emerald-700',
                      ),
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2 px-4">
                <a href="#footer-site-map-heading" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Full site map (footer)</Button>
                </a>
                <a href="/library" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Browse the Library</Button>
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

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
