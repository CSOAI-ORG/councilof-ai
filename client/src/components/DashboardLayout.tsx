import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  BookOpenCheck,
  ChevronRight,
  ClipboardList,
  Search as SearchIcon,
  Coins,
  LifeBuoy,
  Pin,
  PinOff,
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
import CorpusChip from "@/components/CorpusChip";
import { Header } from "@/components/Header";
import {
  dashboardViewFromSearch,
  dashboardViewLabel,
} from "@/lib/dashboardView";
import { setOsOpen } from "@/lib/osChrome";
import { NAV_ID, PANEL_ID } from "@/components/lobby/LobbyPaneTabs";
import { MENU_GROUPS, SUPPORT_LINKS, readStartTab, writeStartTab } from "@/components/gspc/workspaceMenu";
import BoardStatusStrip from "@/components/gspc/BoardStatusStrip";
import { recordActivity, useActivity } from "@/components/lobby/workspace";
import { LOBBY_TABS } from "@/components/lobby/tabs";

const SMALL_QUERY = "(max-width: 767px)";

const SECTION_ICONS: Record<DashboardNavGroupId, typeof Gauge> = {
  ask: SearchIcon,
  mine: ClipboardList,
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
    (activeTab === "home" ? "Get results" : paneLabel(activeTab) || activeTab)
  );
}

/**
 * The global menu: the seven sections in labelled groups (Measure, Build, Learn, Markets,
 * Accountability), with the active section's panes nested under it. Shared by the desktop sidebar
 * and the mobile drawer. Grouping adds no section; the sections stay DASHBOARD_NAV_GROUPS.
 */
function SectionLinks({
  activeGroup,
  activeTab,
  onNavigate,
}: {
  activeGroup: DashboardNavGroupId | null;
  activeTab: string;
  onNavigate?: () => void;
}) {
  const byId = new Map(DASHBOARD_NAV_GROUPS.map((g) => [g.id, g]));
  // Recently visited: the last three panes this session opened, other than the one on screen.
  const recent = [...new Map(useActivity().filter((a) => a.kind === "pane" && a.tabId && a.tabId !== activeTab).map((a) => [a.tabId!, a])).values()].slice(0, 3);
  return (
    <div className="space-y-4">
      {recent.length ? (
        <div role="group" aria-label="Recently visited">
          <p className="px-3 pb-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Recent</p>
          <ul className="space-y-0.5">
            {recent.map((a) => (
              <li key={a.tabId}>
                <Link
                  href={`/dashboard?tab=${a.tabId}`}
                  onClick={onNavigate}
                  className="flex min-h-9 items-center rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <span className="truncate">{a.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {MENU_GROUPS.map((mg) => (
        <div key={mg.heading ?? "primary"} role="group" aria-label={mg.heading ?? "Ask"}>
          {mg.heading ? (
            <p className="px-3 pb-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-slate-600">{mg.heading}</p>
          ) : null}
          <ul className="space-y-1">
            {mg.sections.map((id) => {
              const group = byId.get(id);
              const first = group?.tabs[0];
              if (!group || !first) return null;
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
        </div>
      ))}
    </div>
  );
}

/** Support and resources: one disclosure at the foot of the menu. Pages and machine files only. */
function SupportMenu() {
  return (
    <details className="group/support rounded-xl border border-border bg-white" data-testid="ws-support">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
        <LifeBuoy className="h-4 w-4 text-slate-500" aria-hidden="true" />
        Support and resources
      </summary>
      <ul className="space-y-0.5 border-t border-border p-2">
        {SUPPORT_LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="flex min-h-9 items-center rounded-lg px-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** "Start here": make the current pane this browser's landing page for /dashboard (or undo it). */
function StartPageButton({ activeTab }: { activeTab: string }) {
  const [start, setStart] = useState<string | null>(null);
  useEffect(() => setStart(readStartTab()), []);
  const isStart = activeTab === "home" ? start === null : start === activeTab;
  if (activeTab === "home" && start === null) return null;
  return (
    <button
      type="button"
      aria-pressed={isStart}
      onClick={() => {
        const next = isStart ? null : activeTab;
        writeStartTab(next);
        setStart(next === "home" ? null : next);
      }}
      title={isStart ? "Opening /dashboard lands here in this browser. Click to go back to Ask." : "Make this pane where /dashboard opens, in this browser only."}
      className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:inline-flex"
      data-testid="ws-start-page"
    >
      {isStart ? <PinOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Pin className="h-3.5 w-3.5" aria-hidden="true" />}
      {isStart ? "Your start page" : "Start here"}
    </button>
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
  const [, setLocation] = useLocation();
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
  const hasTabParam = params.has("tab") || params.has("view");
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

  // A saved start page applies only to a bare /dashboard; any explicit link wins.
  useEffect(() => {
    if (hasTabParam || framed) return;
    const saved = readStartTab();
    if (saved && saved !== "home") setLocation(`/dashboard?tab=${saved}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tab = LOBBY_TABS.find((t) => t.id === activeTab);
    if (tab && activeTab !== "home" && !embeddedView) recordActivity({ kind: "pane", label: tab.label, tabId: tab.id });
  }, [activeTab, embeddedView]);

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
            <p className="text-base font-black tracking-tight text-slate-900">Council OS</p>
            <p className="mt-0.5 text-xs text-slate-600">Independent AI measurements, on request</p>
          </div>
          <nav
            id={isSmall ? undefined : NAV_ID}
            aria-label="Workspace destinations"
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
          >
            <SectionLinks activeGroup={group?.id ?? null} activeTab={activeTab} />
            <div className="mt-5">
              <SupportMenu />
            </div>
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
                <p className="text-sm font-semibold text-slate-900">Council OS</p>
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
                  activeTab={activeTab}
                  onNavigate={() => setDrawerOpen(false)}
                />
                <div className="mt-4">
                  <SupportMenu />
                </div>
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
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {/* The card corpus in view, named in the Council OS chrome (the site header shows it from 2xl). */}
                {!embeddedView && activeTab !== "home" && activeTab !== "mine" ? <CorpusChip className="hidden md:inline-flex 2xl:hidden" /> : null}
                {!embeddedView ? <StartPageButton activeTab={activeTab} /> : null}
                <div id={SECTION_ACTIONS_ID} className="flex shrink-0 items-center gap-2" />
              </div>
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

          {activeTab !== "home" && !embeddedView ? <BoardStatusStrip /> : null}
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
