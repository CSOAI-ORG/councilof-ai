import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, ChevronDown, Search, Award, MessageSquareText } from 'lucide-react';
// Signed-in only, and it pulls the tRPC notification client: loaded on demand, not in every first paint.
const NotificationCenter = lazy(() => import('@/pages/NotificationCenter').then((m) => ({ default: m.NotificationCenter })));
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
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
// 30 Sep 2026 (council-os-watch): the old header search (a model call) is retired. ⌘K / Ctrl-K opens the palette
// (components/ask/CommandPalette.tsx, loaded on first use) whose search falls through to Ask GSPC.
import { openAsk, openPalette } from '@/components/ask/askBus';
import CorpusChip from '@/components/CorpusChip';
import { PRIMARY_LINKS, navigation } from '@/components/HeaderNav';
export { HOME_NAV, ARCHIVE_NAV } from '@/components/HeaderNav';

// SPA hops keep this header mounted: it lives above the router in App.tsx.
// ONE header for the whole site (ux-unify, 27 Sep 2026): Council OS renders this same
// component with `inApp` instead of a second, darker top bar of its own. `inApp` only
// overrides the "OS owns the viewport" rule; an embedded (framed) view still hides it,
// because DashboardLayout never mounts it there.
export function Header({ inApp = false }: { inApp?: boolean } = {}) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideChrome = useSiteChromeHidden();

  const isActive = (href: string) => {
    const path = href.split(/[?#]/)[0];
    if (!path || path === '/') return false;
    return location === path || location.startsWith(path + '/');
  };

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [location]);

  // /gspc-verify stays free + loginless — no Sign In chrome on this route.
  const loginlessVerify =
    location === '/gspc-verify' || location.startsWith('/gspc-verify/');

  if (hideChrome && !inApp) return null;

  return (
    <header data-site-header="" className="sticky top-0 z-50 w-full shrink-0 border-b border-emerald-950/10 bg-white/[0.94] shadow-[0_10px_35px_rgba(6,21,15,0.06)] backdrop-blur-xl">
      <nav id="navigation" className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10">
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
            <span className="whitespace-nowrap text-lg font-black tracking-tight text-emerald-800 sm:text-xl 2xl:text-2xl">Council of AI</span>
          </a>

          <div className="hidden md:flex items-center" ref={dropdownRef}>
            <div className="flex items-center gap-1 2xl:gap-3">
              <div className="flex items-center gap-1 xl:hidden">
              {PRIMARY_LINKS.map((item) => (
                <a
                  key={item.href}
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
              <div className="hidden xl:flex items-center gap-1 2xl:gap-3">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    data-nav-trigger={item.name}
                    aria-haspopup="true"
                    aria-expanded={activeDropdown === item.name}
                    aria-controls={`nav-panel-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    className={`px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                      isActive(item.href) || activeDropdown === item.name
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-muted-foreground hover:text-emerald-700 hover:bg-muted'
                    }`}
                    onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                    onFocus={() => handleMouseEnter(item.name)}
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
                      id={`nav-panel-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                      className="absolute left-0 top-full pt-2 z-50"
                      onMouseEnter={() => handleMouseEnter(item.name)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="w-72 max-h-[min(72vh,40rem)] overflow-y-auto rounded-xl border border-border bg-popover shadow-xl">
                        <div className="border-b border-border bg-primary/[0.07] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-5 w-5 text-emerald-600" />
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
                                target={subItem.external ? '_blank' : undefined}
                                rel={subItem.external ? 'noreferrer' : undefined}
                                className="block px-4 py-2.5 hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 transition-colors group"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <div className="font-medium text-foreground group-hover:text-emerald-700 text-sm">
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
                          <a href={item.href} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium" onClick={() => setActiveDropdown(null)}>
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

          <div className="hidden md:flex flex-nowrap items-center gap-2 2xl:gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden rounded-xl font-semibold text-emerald-800 hover:bg-emerald-50 lg:inline-flex"><Link href="/dashboard?tab=verify">Verify</Link></Button>
            <CorpusChip />
            <button
              type="button"
              onClick={() => openAsk()}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-800/25 px-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-50"
              aria-label="Ask about the results"
              title="Ask about the results"
              data-testid="ask-launcher"
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              <span>Ask</span>
            </button>
            <button type="button" onClick={() => openPalette()} className="inline-flex min-h-10 shrink-0 items-center rounded-xl p-2 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-800" aria-label="Search pages and ask (Ctrl K)" title="Search pages and ask (Ctrl K / ⌘K)" aria-keyshortcuts="Control+K Meta+K" data-testid="palette-launcher">
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            {user ? (
              <>
                <Suspense fallback={null}><NotificationCenter /></Suspense>
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
                <Button asChild size="sm" className="rounded-xl bg-emerald-700 font-semibold text-white shadow-sm hover:bg-emerald-800"><Link href="/dashboard" data-testid="header-council-os">Council OS</Link></Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button type="button" onClick={() => openAsk()} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-emerald-900 hover:bg-muted" aria-label="Ask about the results" data-testid="ask-launcher-mobile"><MessageSquareText className="h-5 w-5" aria-hidden="true" /><span className="sr-only sm:not-sr-only">Ask</span></button>
            <button type="button" onClick={() => openPalette()} className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Search pages and ask"><Search className="h-5 w-5" aria-hidden="true" /></button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-1">
              <a href="/" className={`block px-4 py-3 rounded-lg font-medium ${
                location === '/' ? 'text-emerald-700 bg-emerald-50' : 'text-foreground/80'
              }`} onClick={() => setMobileMenuOpen(false)}>Home</a>
              {PRIMARY_LINKS.filter((item) => !navigation.some((g) => g.name === item.name)).map((item) => (
                <a key={item.href} href={item.href} className={`block px-4 py-3 rounded-lg font-medium ${
                  isActive(item.href) ? "text-emerald-700 bg-emerald-50" : "text-foreground/80"
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
                      isActive(item.href) ? 'text-emerald-700 bg-emerald-50' : 'text-foreground/80'
                    }`}
                  >
                    <item.icon className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openMobileGroup === item.name ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    id={`mobile-group-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    hidden={openMobileGroup !== item.name}
                    className="ml-12 space-y-1"
                  >
                    <a href={item.href} className="block px-4 py-2 text-sm font-medium text-emerald-700" onClick={() => setMobileMenuOpen(false)}>
                      All {item.name.toLowerCase()}
                    </a>
                    {item.submenu.map((subItem) => (
                      <div key={subItem.href + subItem.name}>
                        {subItem.section && (
                          <div className="px-4 pt-3 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{subItem.section}</div>
                        )}
                        <a href={subItem.href} target={subItem.external ? '_blank' : undefined} rel={subItem.external ? 'noreferrer' : undefined} className="block px-4 py-2 text-sm text-muted-foreground hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded" onClick={() => setMobileMenuOpen(false)}>
                          {subItem.name}
                          {subItem.external && <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">JSON</span>}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-border space-y-2 px-4">
                <a href="/library" className="block" onClick={() => setMobileMenuOpen(false)}><Button variant="outline" className="w-full">Browse the full Library</Button></a>
                {user ? (
                  <>
                    <Button asChild variant="outline" className="w-full justify-start"><a href="/dashboard" onClick={() => setMobileMenuOpen(false)}><BarChart3 className="h-4 w-4 mr-2" />Dashboard</a></Button>
                    <Button variant="ghost" className="w-full justify-start text-red-600" onClick={() => { logout(); setMobileMenuOpen(false); }}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800"><a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Council OS</a></Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
