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
    setSearchOpen(false);
  }, [location]);

  if (hideChrome) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 shadow-sm backdrop-blur-md">
      <nav id="navigation" className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
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
            <span className="text-xl 2xl:text-2xl font-bold text-emerald-700 tracking-tight whitespace-nowrap">Council of AI</span>
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
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground/80 hover:bg-muted transition-colors" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
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
                <Link href="/login"><Button variant="ghost" size="sm" className="text-muted-foreground font-medium">Sign In</Button></Link>
                <Link href="/assess"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">Get measured</Button></Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Search"><Search className="h-5 w-5" /></button>
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
                    <a href="/dashboard" className="block"><Button variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}><BarChart3 className="h-4 w-4 mr-2" />Dashboard</Button></a>
                    <Button variant="ghost" className="w-full justify-start text-red-600" onClick={() => { logout(); setMobileMenuOpen(false); }}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
                  </>
                ) : (
                  <>
                    <a href="/login" className="block"><Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>Sign In</Button></a>
                    <a href="/assess" className="block"><Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setMobileMenuOpen(false)}>Get measured</Button></a>
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
