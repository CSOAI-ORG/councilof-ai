/*
 * Council software (DSH) — same destinations as Council OS.
 *
 * Standalone /dashboard keeps this rail. When the OS frames this page
 * (?embed=1) the rail is dropped so there is only one tab list.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Settings,
  ChevronLeft,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { isEmbedded } from "@/lib/embed";
import { DASHBOARD_TABS } from "@/components/lobby/tabs";
import DashboardPane from "@/components/DashboardPane";
import { useSearch as useTabSearch } from "wouter";
import { dashboardCrumbs } from "@/components/lobby/breadcrumbs";
import { openLobby } from "@/lib/lobbyLink";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const framed = isEmbedded();

  if (framed) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  const current = DASHBOARD_TABS.find((t) => t.path && location.startsWith(t.path));
  const tabSearch = useTabSearch();
  const activeTab = new URLSearchParams(tabSearch.startsWith("?") ? tabSearch.slice(1) : tabSearch).get("tab") || "home";
  // Council OS = this shell. A tab renders its pane HERE; it never navigates out to the site.
  const pane = activeTab !== "home" && activeTab !== "software" ? <DashboardPane id={activeTab} /> : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 0 : 260 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden",
          sidebarCollapsed && "border-r-0",
        )}
      >
        <div className="flex items-center justify-between p-2 pt-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full justify-start px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <img
                src="/csoai-icon.svg"
                alt=""
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-semibold">Council OS</span>
            </Button>
          </Link>
        </div>

        <nav
          aria-label="Council software destinations"
          className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
        >
          {DASHBOARD_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link key={tab.id} href={`/dashboard?tab=${tab.id}`}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="truncate">{tab.label}</span>
                </div>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => { window.location.assign("/dashboard?tab=home"); }}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Chat
          </button>
        </nav>
      </motion.aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Collapse or expand sidebar"
              className="h-8 w-8"
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  sidebarCollapsed && "rotate-180",
                )}
              />
            </Button>
            {/* Route-derived breadcrumbs (see lobby/breadcrumbs.ts): the trail
                says where this page sits, each non-current crumb is a real link,
                and the current one is text. The sidebar tab's label names the
                current destination when it owns this exact route. */}
            <nav aria-label="You are here" className="flex min-w-0 items-center gap-1 text-sm">
              {dashboardCrumbs(location).map((c, i, all) => {
                const label =
                  c.current && current?.path && location.startsWith(current.path) && i === all.length - 1 && current.path === location
                    ? current.label
                    : c.label;
                return (
                  <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                    {i > 0 && <span aria-hidden="true" className="text-muted-foreground">›</span>}
                    {c.current ? (
                      <span aria-current="page" className="truncate font-medium">{label}</span>
                    ) : c.path ? (
                      <Link href={c.path} className="truncate text-muted-foreground hover:text-foreground hover:underline">
                        {label}
                      </Link>
                    ) : (
                      <span className="truncate text-muted-foreground">{label}</span>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Nav-integrity 2026-08-26: ThemeProvider is mounted without `switchable`,
                so `toggleTheme` is undefined and this control did nothing on 8 public
                routes. A button that says "toggle" and does not toggle is a lie — it is
                only rendered when a real toggle exists. */}
            {toggleTheme ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle light/dark theme"
                className="h-8 w-8"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            ) : null}
            <Link href="/settings">
              <Button aria-label="Settings" variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {pane ?? children}
            {/* Canon free rail (doctrine + persona gauntlet 'buyer'): verify is free, a grade is never sold. */}
            <p className="mt-6 text-xs text-muted-foreground" data-testid="free-rail">
              Verify is free. A grade is never sold. No public prices — measurement, not certification.
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
