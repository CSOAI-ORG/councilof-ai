import { useMemo, useRef, useState, type ReactNode } from "react";
import { LOBBY_GROUPS, LOBBY_TABS, type LobbyGroup, type LobbyTab, type LobbyTabId } from "./tabs";
import { FOCUS, SP, SURFACE, TYPE, panelStyle } from "./glass";

/**
 * LobbyPaneRail — the LEFT rail: a unified, grouped side-menu of every pane.
 *
 * A real WAI-ARIA vertical tablist, grouped into Measure / Explore / Tooling, each
 * with an icon and a collapsible group header. It stays ONE tablist (the arrow-key
 * roving tabindex + Home/End still traverse every VISIBLE tab in order), so a
 * screen-reader user hears one coherent list even though it is visually grouped.
 *
 * The ground rule from tabs.ts holds: each pane frames the live route, never a copy.
 */

export const PANEL_ID = "coai-lobby-panel";
export const tabDomId = (id: LobbyTabId) => `coai-lobby-tab-${id}`;

const GROUP_KEY = "coai.lobby.collapsedGroups";

function readCollapsed(): Record<LobbyGroup, boolean> {
  try {
    const v = JSON.parse(localStorage.getItem(GROUP_KEY) || "{}");
    return { measure: false, explore: false, tooling: !!v.tooling };
  } catch {
    return { measure: false, explore: false, tooling: false };
  }
}

/** Inline icon set — 24x24 stroke, `currentColor`, decorative (aria-hidden). */
const ICONS: Record<string, (c: string) => ReactNode> = {
  home: (c) => <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6" />,
  board: (c) => <path d="M4 4v16M10 4v16M16 4v16M20 4v16" />,
  verify: (c) => <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6Z" />,
  assess: (c) => <path d="M4 20V9M10 20V4M16 20v-7M22 20H2" />,
  watchdog: (c) => <path d="M3 9 5 7l7 2 7-2 2 2-2 9H5Z" />,
  space: (c) => <path d="M12 3 21 12l-9 9-9-9Z" />,
  ecosystem: (c) => <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 9 5-5M12 12l-4 4" />,
  enterprise: (c) => <path d="M3 21V8l6-4 6 4v13M15 21v-9l6-4v13M3 21h18M7 10h1M7 13h1M7 16h1M16 12h1" />,
  intel: (c) => <path d="M4 5h16M4 12h12M4 19h16" />,
  brief: (c) => <path d="M5 4h14v16H5ZM8 8h8M8 12h8M8 16h5" />,
  academy: (c) => <path d="M3 9l9-5 9 5-9 5-9-5ZM5 12v5c0 1.5 3.5 3 7 3s7-1.5 7-3v-5" />,
  models: (c) => <path d="M12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 18a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19 18a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM7 18l3-6M17 18l-3-6" />,
  tools: (c) => <path d="M14 6a4 4 0 0 1 5-5l-2 3 2 3-3 2M9 12 3 18l3 3 6-6M12 9l3 3" />,
  meok: (c) => <path d="M3 12h5l3-7 2 8 2-5 2 4h4" />,
  play: (c) => <path d="M6 5v14l12-7Z" />,
};

function GroupIcon({ id }: { id: LobbyGroup }) {
  const path = { measure: "M4 6h16M4 12h16M4 18h10", explore: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", tooling: "M12 3l9 5v8l-9 5-9-5V8Z" }[id];
  return <path d={path} />;
}

export default function LobbyPaneRail({
  tabId,
  onSelect,
}: {
  tabId: LobbyTabId;
  onSelect: (t: LobbyTab) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Record<LobbyGroup, boolean>>(readCollapsed);

  /** Visible tabs = tabs in expanded groups, in menu order (the roving-tabindex universe). */
  const visible = useMemo(
    () => LOBBY_TABS.filter((t) => !collapsed[t.group]),
    [collapsed],
  );

  const persist = (next: Record<LobbyGroup, boolean>) => {
    setCollapsed(next);
    try { localStorage.setItem(GROUP_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const toggle = (g: LobbyGroup) => persist({ ...collapsed, [g]: !collapsed[g] });

  const move = (to: number) => {
    if (visible.length === 0) return;
    const i = ((to % visible.length) + visible.length) % visible.length;
    const next = visible[i];
    onSelect(next);
    setTimeout(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`#${tabDomId(next.id)}`)?.focus();
    }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = visible.findIndex((t) => t.id === tabId);
    switch (e.key) {
      case "ArrowDown": case "ArrowRight": e.preventDefault(); move(at + 1); break;
      case "ArrowUp": case "ArrowLeft": e.preventDefault(); move(at - 1); break;
      case "Home": e.preventDefault(); move(0); break;
      case "End": e.preventDefault(); move(visible.length - 1); break;
      default: break;
    }
  };

  const isVisible = (id: LobbyTabId) => visible.some((t) => t.id === id);

  return (
    <nav
      aria-label="Council Lobby destinations"
      className={`${SURFACE} ${SP.rail} hidden w-56 shrink-0 flex-col sm:flex lg:w-64`}
      style={panelStyle}
    >
      <h2 className={`${TYPE.section} mb-3 shrink-0 px-1`}>Destinations</h2>

      <div
        ref={listRef}
        role="tablist"
        aria-orientation="vertical"
        aria-label="Council Lobby destinations"
        onKeyDown={onKeyDown}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        {LOBBY_GROUPS.map((g) => {
          const groupTabs = LOBBY_TABS.filter((t) => t.group === g.id);
          const isCollapsed = collapsed[g.id];
          return (
            <div key={g.id} className="mb-2">
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={`coai-group-${g.id}`}
                onClick={() => toggle(g.id)}
                className={`flex w-full items-center gap-2 px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-800 ${FOCUS}`}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <GroupIcon id={g.id} />
                </svg>
                <span>{g.label}</span>
                <svg viewBox="0 0 24 24" className={`ml-auto h-3 w-3 transition motion-safe:transition ${isCollapsed ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <div
                id={`coai-group-${g.id}`}
                className="flex flex-col gap-1"
                hidden={isCollapsed}
              >
                {groupTabs.map((t) => {
                  const on = t.id === tabId;
                  const gold = t.accent === "gold";
                  const active = on && isVisible(t.id);
                  return (
                    <button
                      key={t.id}
                      id={tabDomId(t.id)}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls={PANEL_ID}
                      tabIndex={active ? 0 : -1}
                      onClick={() => onSelect(t)}
                      className={
                        `flex w-full shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition ` +
                        `motion-reduce:transition-none ${FOCUS} ` +
                        (active
                          ? gold
                            ? "bg-amber-100 text-amber-900 ring-1 ring-amber-600/40"
                            : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-700/30"
                          : gold
                            ? "text-amber-800 hover:bg-amber-50"
                            : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900")
                      }
                    >
                      <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${gold ? "text-amber-700" : "text-emerald-700/80"}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {ICONS[t.icon]?.(t.icon) ?? <path d="M12 12h.01" />}
                      </svg>
                      <span className="min-w-0">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className={`shrink-0 pt-3 ${TYPE.fine}`} title="Nothing here is a copy of a page, so nothing here can drift from one.">
        Each pane frames the real route — never a copy of it.
      </p>
    </nav>
  );
}
