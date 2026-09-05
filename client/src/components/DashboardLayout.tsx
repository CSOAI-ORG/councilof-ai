import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ChevronLeft, Menu, Moon, Settings, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { isEmbedded } from "@/lib/embed";
import {
  DASHBOARD_NAV_GROUPS,
  normalizeLobbyTabId,
} from "@/components/lobby/tabs";
import DashboardPane, { paneLabel } from "@/components/DashboardPane";
import DashboardWorkspace from "@/components/DashboardWorkspace";
import DashboardAccountMenu from "@/components/DashboardAccountMenu";
import { CouncilBrand } from "@/components/brand/CouncilBrand";
import {
  dashboardViewFromSearch,
  dashboardViewHref,
  dashboardViewLabel,
} from "@/lib/dashboardView";
import { setOsOpen } from "@/lib/osChrome";
import { NAV_ID, PANEL_ID } from "@/components/lobby/LobbyPaneTabs";

const SMALL_QUERY = "(max-width: 767px)";

export function dashboardActiveLabel(activeTab: string, search: string): string {
  const embeddedViewLabel = dashboardViewFromSearch(search)
    ? dashboardViewLabel(search)
    : null;
  return (
    embeddedViewLabel ||
    (activeTab === "home" ? "Conversation" : paneLabel(activeTab) || activeTab)
  );
}

/** Supporting pages framed by Council OS contribute content only. The parent
 * dashboard owns navigation, chat, the composer and workspace rail. */
export function EmbeddedDashboardPage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-svh bg-[var(--surface-canvas,#fafaf7)] text-foreground"
      data-testid="dashboard-embedded-page"
    >
      {children}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const search = useSearch();
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isSmall, setIsSmall] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia?.(SMALL_QUERY).matches,
  );
  const [sidebarOpen, setSidebarOpen] = useState(
    () =>
      !(
        typeof window !== "undefined" &&
        window.matchMedia?.(SMALL_QUERY).matches
      ),
  );
  const { theme, toggleTheme } = useTheme();
  const framed = isEmbedded();

  useEffect(() => {
    document.documentElement.setAttribute("data-coai-dashboard-shell", "1");
    window.dispatchEvent(new Event("coai:dashboard-shell"));
    setOsOpen(true);
    return () => {
      document.documentElement.removeAttribute("data-coai-dashboard-shell");
      window.dispatchEvent(new Event("coai:dashboard-shell"));
      setOsOpen(false);
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(SMALL_QUERY);
    const update = (event: MediaQueryListEvent) => {
      setIsSmall(event.matches);
      setSidebarOpen(!event.matches);
    };
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!isSmall || !sidebarOpen) return;
    navRef.current?.querySelector<HTMLElement>("a")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSidebarOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isSmall, sidebarOpen]);

  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const rawTab = params.get("tab") || "home";
  const activeTab = normalizeLobbyTabId(rawTab);
  const activeLabel = dashboardActiveLabel(activeTab, search);
  const pane =
    activeTab === "home" || activeTab === "software" ? null : (
      <DashboardPane id={activeTab} />
    );

  // The parent Dashboard owns the workspace contract. A supporting route that
  // itself uses DashboardLayout must not mount a second composer and right rail.
  if (framed)
    return (
      <EmbeddedDashboardPage>{children}</EmbeddedDashboardPage>
    );

  return (
    <div
      className="flex h-dvh min-h-svh overflow-hidden bg-[var(--surface-canvas,#fafaf7)]"
      data-testid="dashboard-shell"
    >
      {sidebarOpen ? (
        <aside
          className={cn(
            "z-40 flex w-[17rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
            isSmall && "fixed inset-y-0 left-0 shadow-2xl",
          )}
          aria-label="Council of AI workspace navigation"
        >
          <div className="flex h-[4.5rem] items-center justify-between border-b border-border px-4">
            <Link
              href="/dashboard?tab=home"
              className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <CouncilBrand
                context="Workspace"
                size="sm"
                className="[&_[data-council-brand]]:min-w-0"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close workspace navigation"
              onClick={() => {
                setSidebarOpen(false);
                menuButtonRef.current?.focus();
              }}
              className="h-9 w-9 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <nav
            id={NAV_ID}
            ref={navRef}
            tabIndex={-1}
            aria-label="Workspace destinations"
            className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
          >
            {DASHBOARD_NAV_GROUPS.map((group) => (
              <section
                key={group.id}
                className="mb-4"
                aria-labelledby={`dashboard-nav-${group.id}`}
              >
                <h2
                  id={`dashboard-nav-${group.id}`}
                  className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {group.label}
                </h2>
                <div className="space-y-0.5">
                  {group.tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <Link
                        key={tab.id}
                        href={`/dashboard?tab=${tab.id}`}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          if (isSmall) setSidebarOpen(false);
                        }}
                        className={cn(
                          "relative flex min-h-10 items-center rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          active
                            ? "bg-[var(--surface-selection,#ecfdf5)] font-semibold text-emerald-950 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--brand-institutional,#04624a)]"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <span className="truncate">{tab.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <Link
              href="/dashboard?tab=explore"
              className="mb-3 flex min-h-10 items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
            >
              All tools
            </Link>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Account & workspace
            </p>
            <div className="flex items-center justify-between gap-2">
              <DashboardAccountMenu />
              <Link
                href={dashboardViewHref("/settings", "Settings")}
                aria-label="Open settings in workspace"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>
      ) : null}

      {isSmall && sidebarOpen ? (
        <button
          type="button"
          aria-label="Close workspace navigation"
          className="fixed inset-0 z-30 bg-black/45"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-border bg-card/95 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-expanded={sidebarOpen}
              aria-controls={NAV_ID}
              aria-label={
                sidebarOpen
                  ? "Close workspace navigation"
                  : "Open workspace navigation"
              }
              className="h-10 w-10 shrink-0"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {activeLabel}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Council of AI · measure, sign, verify
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {toggleTheme ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle light or dark theme"
                className="h-9 w-9"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            ) : null}
            <Link
              href={dashboardViewHref("/settings", "Settings")}
              aria-label="Open settings in workspace"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>
            <DashboardAccountMenu />
          </div>
        </header>

        <div
          id={PANEL_ID}
          role="region"
          aria-label={`${activeLabel} workspace canvas`}
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-hidden"
        >
          <DashboardWorkspace
            activePane={pane}
            activeTab={activeTab}
            activeLabel={activeLabel}
          >
            {children}
          </DashboardWorkspace>
        </div>
      </main>
    </div>
  );
}
