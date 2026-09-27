import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, ChevronDown, Search, Award } from 'lucide-react';
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
import { PRIMARY_LINKS, navigation } from '@/components/HeaderNav';
import { CouncilBrand } from '@/components/brand/CouncilBrand';
import { isPublicNavActive } from '@/components/publicNavState';
export { HOME_NAV, ARCHIVE_NAV } from '@/components/HeaderNav';

// SPA hops keep this header mounted: it lives above the router in App.tsx.
export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpened = useRef<string | null>(null);
  const hideChrome = useSiteChromeHidden();

  const isActive = (href: string) => isPublicNavActive(location, href);

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    hoverOpened.current = name;
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    setOpenMobileGroup(null);
    setSearchOpen(false);
  }, [location]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileMenuOpen(false);
      setOpenMobileGroup(null);
      mobileMenuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  if (hideChrome) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 shadow-[0_10px_35px_rgba(6,21,15,0.06)] backdrop-blur-xl">
      <nav id="navigation" className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between gap-3">
          <a href="/" aria-label="Council of AI home" className="inline-flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-90">
            <CouncilBrand variant="compact" size="md" className="public-header-brand" />
          </a>

          <div className="hidden xl:flex items-center" ref={dropdownRef}>
            <div className="flex items-center gap-1 2xl:gap-3">
              <div className="flex items-center gap-1 2xl:hidden">
              {PRIMARY_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive(item.href)
                      ? 'text-primary bg-accent'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
                  }`}
                >
                  {item.name}
                </a>
              ))}
              </div>
              <div className="hidden 2xl:flex items-center gap-1 2xl:gap-3">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onPointerEnter={event => {
                    if (event.pointerType !== 'mouse') return;
                    const focused = dropdownRef.current?.querySelector(':focus');
                    if (focused && !event.currentTarget.contains(focused)) return;
                    handleMouseEnter(item.name);
                  }}
                  onPointerLeave={event => {
                    if (event.pointerType === 'mouse' && !event.currentTarget.contains(document.activeElement)) handleMouseLeave();
                  }}
                  onFocusCapture={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
                  onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      hoverOpened.current = null;
                      setActiveDropdown(current => current === item.name ? null : current);
                    }
                  }}
                >
                  <button
                    type="button"
                    data-nav-trigger={item.name}
                    aria-expanded={activeDropdown === item.name}
                    aria-controls={`nav-panel-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    className={`px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                      isActive(item.href) || activeDropdown === item.name
                        ? 'text-primary bg-accent'
                        : 'text-muted-foreground hover:text-primary hover:bg-muted'
                    }`}
                    onClick={event => {
                      const activatedHover = event.detail > 0 && hoverOpened.current === item.name;
                      if (timeoutRef.current) clearTimeout(timeoutRef.current);
                      setActiveDropdown(activeDropdown === item.name && !activatedHover ? null : item.name);
                      hoverOpened.current = null;
                    }}
                  >
                    {item.name}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {activeDropdown === item.name && (
                    <div
                      id={`nav-panel-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                      className="absolute left-0 top-full pt-2 z-50"
                      onMouseEnter={() => handleMouseEnter(item.name)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="w-72 max-h-[min(72vh,40rem)] overflow-y-auto rounded-xl border border-border bg-popover shadow-xl">
                        <div className="border-b border-border bg-primary/[0.07] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-semibold text-foreground">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          {item.submenu.map((subItem) => (
                            <div key={subItem.href + subItem.name}>
                              {subItem.section && (
                                <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  {subItem.section}
                                </div>
                              )}
                              <a
                                href={subItem.href}
                                aria-current={isActive(subItem.href) ? 'page' : undefined}
                                target={subItem.external ? '_blank' : undefined}
                                rel={subItem.external ? 'noreferrer' : undefined}
                                className="block px-4 py-2.5 hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition-colors group"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <div className="font-medium text-foreground group-hover:text-primary text-sm">
                                  {subItem.name}
                                  {subItem.external && (
                                    <span className="ml-1.5 align-middle text-[9px] font-bold uppercase tracking-wide text-muted-foreground">JSON</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">{subItem.description}</div>
                              </a>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-2 bg-muted border-t border-border">
                          <a href={item.href} className="text-xs text-primary hover:text-primary font-medium" onClick={() => setActiveDropdown(null)}>
                            View all {item.name.toLowerCase()} →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          </div>

          <div className="hidden xl:flex flex-nowrap items-center gap-2 2xl:gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden rounded-xl font-semibold text-brand-institutional hover:bg-accent 2xl:inline-flex"><Link href="/gspc-verify">Verify</Link></Button>
            <button type="button" onClick={() => { setActiveDropdown(null); setMobileMenuOpen(false); setSearchOpen(true); }} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-brand-institutional" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            {user ? (
              <>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Account menu" className="text-muted-foreground h-11 w-11 rounded-full bg-accent hover:bg-accent">
                      <User className="h-4 w-4 text-primary" />
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
                    <DropdownMenuItem asChild><a href="/dashboard" className="flex items-center"><BarChart3 className="h-4 w-4 mr-2" />Dashboard</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href="/my-courses" className="flex items-center"><BookOpen className="h-4 w-4 mr-2" />My Courses</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href="/academy" className="flex items-center"><Award className="h-4 w-4 mr-2" />Training records</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href="/settings" className="flex items-center"><Settings className="h-4 w-4 mr-2" />Settings</a></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600"><LogOut className="h-4 w-4 mr-2" />Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* 2026-09-26: "Sign In" left the main nav (newcomer audit). /login still exists. */}
                <Button asChild size="sm" className="rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"><Link href="/assess">Request attestation</Link></Button>
              </>
            )}
          </div>

          <div className="xl:hidden flex items-center gap-2">
            <button type="button" onClick={() => { setActiveDropdown(null); setMobileMenuOpen(false); setSearchOpen(true); }} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Search"><Search className="h-5 w-5" /></button>
            <button ref={mobileMenuButtonRef} type="button" aria-expanded={mobileMenuOpen} aria-controls="public-mobile-navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="public-mobile-navigation" className="xl:hidden py-4 border-t border-border max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
            <div className="space-y-1">
              <a href="/" className={`block px-4 py-3 rounded-lg font-medium ${
                location === '/' ? 'text-primary bg-accent' : 'text-foreground/80'
              }`} onClick={() => setMobileMenuOpen(false)}>Home</a>
              {PRIMARY_LINKS.filter((item) => !navigation.some((g) => g.name === item.name)).map((item) => (
                <a key={item.href} href={item.href} className={`block px-4 py-3 rounded-lg font-medium ${
                  isActive(item.href) ? "text-primary bg-accent" : "text-foreground/80"
                }`} onClick={() => setMobileMenuOpen(false)}>{item.name}</a>
              ))}
              <a href="/library" className="block px-4 py-3 rounded-lg font-medium text-foreground/80" onClick={() => setMobileMenuOpen(false)}>Library</a>
              {navigation.map((item) => (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    aria-expanded={openMobileGroup === item.name}
                    aria-controls={`mobile-group-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setOpenMobileGroup(openMobileGroup === item.name ? null : item.name)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left ${
                      isActive(item.href) ? 'text-primary bg-accent' : 'text-foreground/80'
                    }`}
                  >
                    <item.icon className="h-5 w-5 text-primary shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${openMobileGroup === item.name ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    id={`mobile-group-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    hidden={openMobileGroup !== item.name}
                    className="ml-12 space-y-1"
                  >
                    <a href={item.href} className="block px-4 py-2 text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
                      All {item.name.toLowerCase()}
                    </a>
                    {item.submenu.map((subItem) => (
                      <div key={subItem.href + subItem.name}>
                        {subItem.section && (
                          <div className="px-4 pt-3 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{subItem.section}</div>
                        )}
                        <a href={subItem.href} target={subItem.external ? '_blank' : undefined} rel={subItem.external ? 'noreferrer' : undefined} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" onClick={() => setMobileMenuOpen(false)}>
                          {subItem.name}
                          {subItem.external && <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">JSON</span>}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-border space-y-2 px-4">
                <Button asChild variant="outline" className="w-full"><a href="/library" onClick={() => setMobileMenuOpen(false)}>Browse the full Library</a></Button>
                {user ? (
                  <>
                    <Button asChild variant="outline" className="w-full justify-start"><a href="/dashboard" onClick={() => setMobileMenuOpen(false)}><BarChart3 className="h-4 w-4 mr-2" />Dashboard</a></Button>
                    <Button variant="ghost" className="w-full justify-start text-red-600" onClick={() => { logout(); setMobileMenuOpen(false); }}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90"><a href="/assess" onClick={() => setMobileMenuOpen(false)}>Request attestation</a></Button>
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
