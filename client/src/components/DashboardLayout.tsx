import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  BookOpenCheck,
  ChevronRight,
  Coins,
  Gauge,
  Menu,
  MessageSquareText,
  PlugZap,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isEmbedded } from "@/lib/embed";
import { useInsideMainLandmark } from "@/contexts/MainLandmarkContext";
import {
  DASHBOARD_NAV_GROUPS,
  dashboardNavGroupOf,
  normalizeLobbyTabId,
  type DashboardNavGroupId,
} from "@/components/lobby/tabs";
import DashboardPane, { paneLabel } from "@/components/DashboardPane";
import DashboardWorkspace, { SECTION_ACTIONS_ID } from "@/components/DashboardWorkspace";
import DashboardAccountMenu from "@/components/DashboardAccountMenu";
import { Header } from "@/components/Header";
import {
  dashboardViewFromSearch,
  dashboardViewLabel,
} from "@/lib/dashboardView";
import { setOsOpen } from "@/lib/osChrome";
import { NAV_ID, PANEL_ID } from "@/components/lobby/LobbyPaneTabs";

const SMALL_QUERY = "(max-width: 767px)";

const SECTION_ICONS: Record<DashboardNavGroupId, typeof Gauge> = {
  ask: MessageSquareText,
  board: Gauge,
  verify: ShieldCheck,
  connect: PlugZap,
  learn: BookOpenCheck,
  sovx: Coins,
  corrections: Scale,
};

export function dashboardActiveLabel(activeTab: string, search: string): string {
  const embeddedViewLabel = dashboardViewFromSearch(search)
    ? dashboardViewLabel(search)
    : null;
  return (
    embeddedViewLabel ||
    (activeTab === "home" ? "Conversation" : paneLabel(activeTab) || activeTab)
  );
}

/** The seven sections, as links. Shared by the desktop sidebar and the mobile drawer. */
function SectionLinks({
  activeGroup,
  onNavigate,
}: {
  activeGroup: DashboardNavGroupId | null;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {DASHBOARD_NAV_GROUPS.map((group) => {
        const first = group.tabs[0];
        if (!first) return null;
        const active = activeGroup === group.id;
        const Icon = SECTION_ICONS[group.id];
        return (
          <li key={group.id}>
            <Link
              href={`/dashboard?tab=${first.id}`}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700",
                active
                  ? "bg-emerald-50 font-semibold text-emerald-950 shadow-[inset_0_0_0_1px_rgba(4,98,74,0.14)]"
                  : "font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-emerald-700" : "text-slate-500 group-hover:text-slate-700",
                )}
                aria-hidden="true"
              />
              <span className="truncate">{group.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inside App's public <main> this layout is a <section>: one <main> landmark per page.
  const Landmark = useInsideMainLandmark() ? "section" : "main";
  const search = useSearch();
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isSmall, setIsSmall] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia?.(SMALL_QUERY).matches,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      if (!event.matches) setDrawerOpen(false);
    };
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  // Mobile drawer: focus the first link on open, close on Escape, return focus to the trigger.
  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current?.querySelector<HTMLElement>("a")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDrawerOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [drawerOpen]);

  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const rawTab = params.get("tab") || "home";
  const activeTab = normalizeLobbyTabId(rawTab);
  const activeLabel = dashboardActiveLabel(activeTab, search);
  const embeddedView = Boolean(dashboardViewFromSearch(search));
  const group = embeddedView ? null : dashboardNavGroupOf(activeTab);
  const pane =
    activeTab === "home" || activeTab === "software" ? null : (
      <DashboardPane id={activeTab} />
    );

  // Embedded tools are a chrome-less view of this same workspace, never the
  // retired OsLauncher or the old account metrics dashboard. The centre pane,
  // persistent composer and responsive workspace drawer retain one contract.
  if (framed)
    return (
      <div className="h-svh min-h-svh overflow-hidden bg-background">
        <DashboardWorkspace
          activePane={pane}
          activeTab={activeTab}
          activeLabel={activeLabel}
        >
          {children}
        </DashboardWorkspace>
      </div>
    );

  const sectionTitle = group?.label ?? activeLabel;
  const subTabs = group && group.tabs.length > 1 ? group.tabs : [];

  return (
    <div
      className="flex h-dvh min-h-svh flex-col overflow-hidden bg-[var(--surface-canvas,#f7f8f4)]"
      data-testid="dashboard-shell"
    >
      {/* The one site header — the same component every public page renders. */}
      <Header inApp />

      <div className="flex min-h-0 flex-1">
        {/* Desktop: the sections are always visible. Mobile: the same list lives in a drawer. */}
        <aside
          className="hidden w-60 shrink-0 flex-col border-r border-emerald-950/10 bg-white md:flex"
          aria-label="Council OS sections"
        >
          <div className="px-5 pb-3 pt-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
              GSPC
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">Council OS workspace</p>
          </div>
          <nav
            id={isSmall ? undefined : NAV_ID}
            aria-label="Workspace destinations"
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
          >
            <SectionLinks activeGroup={group?.id ?? null} />
          </nav>
          <div className="flex items-center justify-between gap-2 border-t border-border p-3">
            <DashboardAccountMenu />
          </div>
        </aside>

        {isSmall && drawerOpen ? (
          <>
            <button
              type="button"
              aria-label="Close workspace navigation"
              tabIndex={-1}
              className="fixed inset-0 z-[60] bg-black/45"
              onClick={() => setDrawerOpen(false)}
            />
            <div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Council OS sections"
              className="fixed inset-y-0 left-0 z-[61] flex w-[min(20rem,86vw)] flex-col bg-white shadow-2xl"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <p className="text-sm font-semibold text-slate-900">GSPC · Council OS</p>
                <button
                  type="button"
                  aria-label="Close workspace navigation"
                  onClick={() => {
                    setDrawerOpen(false);
                    menuButtonRef.current?.focus();
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <nav
                id={NAV_ID}
                aria-label="Workspace destinations"
                className="min-h-0 flex-1 overflow-y-auto p-3"
              >
                <SectionLinks
                  activeGroup={group?.id ?? null}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </nav>
              <div className="border-t border-border p-3">
                <DashboardAccountMenu />
              </div>
            </div>
          </>
        ) : null}

        <Landmark className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Section bar: where you are, and the panes inside this section. */}
          <div className="shrink-0 border-b border-emerald-950/10 bg-white px-3 sm:px-5">
            <div className="flex min-h-12 items-center gap-2 py-1.5">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setDrawerOpen((open) => !open)}
                aria-expanded={drawerOpen}
                aria-controls={NAV_ID}
                aria-label={
                  drawerOpen
                    ? "Close workspace navigation"
                    : "Open workspace navigation"
                }
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 md:hidden"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
                Sections
              </button>
              <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                <span className="truncate">{sectionTitle}</span>
                {embeddedView ? (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="truncate font-medium text-slate-600">{activeLabel}</span>
                  </>
                ) : null}
              </p>
              {group && !embeddedView ? (
                <p className="hidden min-w-0 flex-1 truncate text-sm text-slate-600 lg:block">
                  {group.description}
                </p>
              ) : null}
              <div id={SECTION_ACTIONS_ID} className="ml-auto flex shrink-0 items-center gap-2" />
            </div>
            {subTabs.length ? (
              <nav
                aria-label={`${group?.label} pages`}
                className="-mb-px flex flex-wrap gap-x-1"
              >
                {subTabs.map((tab) => {
                  const active = tab.id === activeTab;
                  return (
                    <Link
                      key={tab.id}
                      href={`/dashboard?tab=${tab.id}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-10 items-center border-b-2 px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700",
                        active
                          ? "border-emerald-700 font-semibold text-emerald-900"
                          : "border-transparent font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900",
                      )}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </div>

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
        </Landmark>
      </div>
    </div>
  );
}
