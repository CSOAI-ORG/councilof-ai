import { useRef } from "react";
import { LOBBY_TABS, tabById, type LobbyTab, type LobbyTabId } from "./tabs";
import { NAV_GROUPS } from "./lobbyNav";
import { CONTROL, FOCUS, SP, SURFACE, TYPE, panelStyle } from "./glass";

export const PANEL_ID = "coai-lobby-panel";
export const tabDomId = (id: LobbyTabId) => `coai-lobby-tab-${id}`;

const flatOrder = NAV_GROUPS.flatMap((g) => g.items);

export default function LobbyPaneRail({
  tabId,
  onSelect,
  onMinimise,
}: {
  tabId: LobbyTabId;
  onSelect: (t: LobbyTab) => void;
  onMinimise?: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const move = (to: number) => {
    const id = flatOrder[((to % flatOrder.length) + flatOrder.length) % flatOrder.length];
    const next = tabById(id);
    onSelect(next);
    setTimeout(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`#${tabDomId(next.id)}`)?.focus();
    }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = flatOrder.indexOf(tabId);
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
        move(flatOrder.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <nav
      aria-label="Council OS"
      className={`${SURFACE} ${SP.rail} flex h-full w-full shrink-0 flex-col`}
      style={panelStyle}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
        <h2 className={TYPE.section}>Council OS</h2>
        {onMinimise && (
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Hide sidebar"
            className={`${CONTROL} ${SP.chip} text-[11px] font-semibold`}
          >
            Hide
          </button>
        )}
      </div>

      <div
        ref={listRef}
        role="tablist"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={`mb-1.5 px-1 ${TYPE.section}`}>{group.title}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((id) => {
                const t = tabById(id);
                const on = t.id === tabId;
                const gold = t.accent === "gold";
                const surface = t.kind === "route";
                return (
                  <button
                    key={t.id}
                    id={tabDomId(t.id)}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls={PANEL_ID}
                    tabIndex={on ? 0 : -1}
                    onClick={() => onSelect(t)}
                    className={
                      `w-full rounded-xl px-3 py-2 text-left transition motion-reduce:transition-none ${FOCUS} ` +
                      (on
                        ? gold
                          ? "bg-amber-100 text-amber-900 ring-1 ring-amber-600/40"
                          : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-700/30"
                        : gold
                          ? "text-amber-800 hover:bg-amber-50"
                          : "text-slate-700 hover:bg-slate-900/5")
                    }
                  >
                    <span className="text-[13px] font-semibold leading-snug">{t.label}</span>
                    {surface && t.path && (
                      <span className={`mt-0.5 block font-mono text-[10px] text-slate-500`}>{t.path}</span>
                    )}
                    {gold && (
                      <span className="mt-0.5 block text-[10px] font-medium text-amber-800">
                        not a measurement surface
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className={`shrink-0 pt-3 ${TYPE.fine}`}>
        Leaderboards and MCP tools stay in this workspace. Surfaces open in the site column — never framed here.
      </p>
    </nav>
  );
}
