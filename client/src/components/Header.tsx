/**
 * Product Header — OpenRouter-style SaaS chrome.
 * Search ⌘K · Home · Models · Benchmarks · Chat · Rankings · Apps · Enterprise · Docs
 *
 * The old mega-menu (Workspace, Software, Measure, Agents, Surfaces) is the
 * bottom estate bar — nothing is dropped.
 */

import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Menu, X, Search, User, LogOut, Settings, BarChart3, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteChromeHidden, useOsOpen } from "@/lib/osChrome";
import { openLobby } from "@/lib/lobbyLink";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/pages/NotificationCenter";
import { POSITIONING } from "@/lib/positioning";
import { PRODUCT_TABS } from "@/data/productNav";

const shortcut = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const hideChrome = useSiteChromeHidden();
  const osOpen = useOsOpen();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (hideChrome) return null;

  const activate = (tab: (typeof PRODUCT_TABS)[number], e?: React.MouseEvent) => {
    if (!tab.lobby) return;
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1)) return;
    e?.preventDefault();
    openLobby(tab.lobby);
    setMobileOpen(false);
  };

  const tabClass = (active: boolean) =>
    `rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
      active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-[90rem] items-center gap-2 px-3 sm:px-5" aria-label="Product">
        <a href="/" className="flex shrink-0 items-center gap-2 pr-1" aria-label="Council of AI home">
          <svg viewBox="0 0 100 100" className="h-8 w-8" role="img" aria-hidden="true">
            <path d="M50 4 L91 19 V49 C91 74 50 96 50 96 C50 96 9 74 9 49 V19 Z" fill="#04624a" />
            <path d="M50 12 L84 24 V49 C84 69 50 88 50 88 C50 88 16 69 16 49 V24 Z" fill="#ffffff" />
            <rect x="26" y="66" width="48" height="6" fill="#04624a" />
            <path d="M50 20 L75 32 H25 Z" fill="#04624a" />
          </svg>
          <span className="hidden font-bold tracking-tight text-emerald-800 sm:inline">CSOAI</span>
        </a>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden h-9 min-w-[9.5rem] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-500 hover:border-slate-300 hover:bg-white md:inline-flex"
          aria-label="Search the site"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1">Search</span>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            {shortcut}
          </kbd>
        </button>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {PRODUCT_TABS.map((tab) => {
            const active = tab.match?.(location) ?? false;
            const chatActive = tab.id === "chat" && osOpen;
            return (
              <li key={tab.id}>
                <a
                  href={tab.href}
                  className={tabClass(active || chatActive)}
                  aria-current={active || chatActive ? "page" : undefined}
                  onClick={(e) => activate(tab, e)}
                >
                  {tab.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => openLobby({ pane: "home" })}
            aria-label="Open Council OS"
            className="hidden rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 sm:inline-flex"
          >
            {osOpen ? "Chat" : POSITIONING.os.cta}
          </button>

          {user ? (
            <>
              <NotificationCenter />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg px-2 text-slate-700"
                    aria-label="Personal menu"
                  >
                    <User className="h-4 w-4 text-emerald-700" />
                    <span className="hidden max-w-[7rem] truncate text-sm font-medium md:inline">
                      {user.name || "Personal"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-sm font-medium">{user.name || "Personal"}</div>
                    <div className="truncate text-xs text-slate-500">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/dashboard" className="flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Workspace
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/my-courses" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Activity
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/certificates" className="flex items-center">
                      <Award className="mr-2 h-4 w-4" />
                      Logs
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Preferences
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/pricing">Credits</a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/start">
                <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                  Start free
                </Button>
              </Link>
            </>
          )}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="product-mobile-nav"
            aria-label={mobileOpen ? "Close product menu" : "Open product menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div id="product-mobile-nav" className="border-t border-slate-100 bg-white px-3 py-3 lg:hidden">
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {PRODUCT_TABS.map((tab) => (
              <li key={tab.id}>
                <a
                  href={tab.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  onClick={(e) => activate(tab, e)}
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-1 text-[11px] text-slate-500">All other pages: use the bar at the bottom of the screen.</p>
        </div>
      )}

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
