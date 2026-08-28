import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { tabById, type LobbyTab, type LobbyTabId } from "./tabs";
import { CONTROL, FOCUS, SP, SURFACE, TYPE, panelStyle } from "./glass";
import { COUNCIL_OS_LEFT_MENU, type SideMenuItem } from "@/data/councilOsSideMenu";
import { openLobby } from "@/lib/lobbyLink";

export const PANEL_ID = "coai-lobby-panel";
export const tabDomId = (id: LobbyTabId | string) => `coai-lobby-tab-${id}`;

const STORAGE_KEY = "coai.os.menu.collapsed";

function readCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function Badge({ kind }: { kind?: "live" | "api" | "train" }) {
  if (!kind) return null;
  const cls =
    kind === "live"
      ? "bg-emerald-100 text-emerald-800"
      : kind === "api"
        ? "bg-slate-100 text-slate-600"
        : "bg-amber-100 text-amber-900";
  return (
    <span className={`ml-auto shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide ${cls}`}>
      {kind}
    </span>
  );
}

export default function LobbyPaneRail({
  tabId,
  onSelect,
  onOpenRoute,
  onMinimise,
}: {
  tabId: LobbyTabId;
  onSelect: (t: LobbyTab) => void;
  onOpenRoute?: (path: string, label: string) => void;
  onMinimise?: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(readCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const flatPanes = COUNCIL_OS_LEFT_MENU.flatMap((g) =>
    g.items.filter((i): i is Extract<SideMenuItem, { kind: "pane" }> => i.kind === "pane"),
  );

  const move = (to: number) => {
    const item = flatPanes[((to % flatPanes.length) + flatPanes.length) % flatPanes.length];
    onSelect(tabById(item.pane));
    setTimeout(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`#${tabDomId(item.id)}`)?.focus();
    }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = flatPanes.findIndex((i) => i.pane === tabId);
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        move(at + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        move(at - 1);
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(flatPanes.length - 1);
        break;
      default:
        break;
    }
  };

  /** Every master-menu click seeds the centre composer (consent lock). */
  const activate = (item: SideMenuItem) => {
    if (item.kind === "pane") {
      const tab = tabById(item.pane);
      onSelect(tab);
      if (item.task) {
        openLobby({ pane: item.pane, task: item.task });
      } else {
        openLobby({
          pane: item.pane,
          prompt: `Open ${item.label} — what is published here, and what can I control by asking?`,
        });
      }
      if (tab.path && onOpenRoute) onOpenRoute(tab.path, tab.label);
      return;
    }
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      openLobby({
        prompt: `What does the external surface “${item.label}” publish, and how does it relate to Council OS measurement?`,
      });
      return;
    }
    if (onOpenRoute) onOpenRoute(item.href, item.label);
    else window.location.href = item.href;
    openLobby({
      prompt: `Walk me through ${item.label} at ${item.href} — what can I measure or control from Council OS chat?`,
    });
  };

  const isActive = (item: SideMenuItem) => {
    if (item.kind === "pane") return item.pane === tabId;
    const t = tabById(tabId);
    return t.path === item.href;
  };

  return (
    <nav
      aria-label="Council OS master menu"
      className={`${SURFACE} ${SP.rail} flex h-full w-full shrink-0 flex-col`}
      style={panelStyle}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
        <h2 className={TYPE.section}>Master menu</h2>
        {onMinimise && (
          <button type="button" onClick={onMinimise} aria-label="Hide sidebar" className={`${CONTROL} ${SP.chip} text-[11px] font-semibold`}>
            Hide
          </button>
        )}
      </div>

      <div
        ref={listRef}
        role="tablist"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
      >
        {COUNCIL_OS_LEFT_MENU.map((group) => {
          const shut = collapsed[group.id] ?? !group.defaultOpen;
          return (
            <div key={group.id} className="rounded-xl border border-slate-900/5 bg-slate-900/[0.02]">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !shut }))}
                className={`flex w-full items-center gap-1 rounded-xl px-2 py-1.5 text-left ${FOCUS}`}
                aria-expanded={!shut}
              >
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${shut ? "-rotate-90" : ""}`} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{group.title}</span>
              </button>
              {!shut && (
                <div className="flex flex-col gap-0.5 px-1 pb-1.5">
                  {group.items.map((item) => {
                    const on = isActive(item);
                    const Icon = item.icon;
                    const gold = item.kind === "pane" && tabById(item.pane).accent === "gold";
                    return (
                      <button
                        key={item.id}
                        id={tabDomId(item.id)}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        aria-controls={PANEL_ID}
                        tabIndex={on ? 0 : -1}
                        title={`${item.hint} · seeds chat`}
                        onClick={() => activate(item)}
                        className={
                          `flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition motion-reduce:transition-none ${FOCUS} ` +
                          (on
                            ? gold
                              ? "bg-amber-100 text-amber-900 ring-1 ring-amber-600/30"
                              : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-700/25"
                            : "text-slate-700 hover:bg-white/80")
                        }
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-snug">{item.label}</span>
                        <Badge kind={item.badge} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 shrink-0 space-y-1 border-t border-slate-900/10 pt-2">
        <p className={`px-1 ${TYPE.fine}`}>
          Every item seeds Ask · <kbd className="rounded bg-slate-100 px-1">[</kbd> menu ·{" "}
          <kbd className="rounded bg-slate-100 px-1">]</kbd> AG-UI rail
        </p>
      </div>
    </nav>
  );
}
