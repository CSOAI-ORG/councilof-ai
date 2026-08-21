import { useRef } from "react";
import { LOBBY_TABS, type LobbyTab, type LobbyTabId } from "./tabs";
import { FOCUS, SP, SURFACE, TYPE, panelStyle } from "./glass";

/**
 * LobbyPaneRail — the LEFT rail: the pane / destination list.
 *
 * A real WAI-ARIA vertical tablist, not a pile of buttons:
 *   role="tablist" aria-orientation="vertical", each control role="tab" with
 *   aria-selected and aria-controls pointing at the centre pane's tabpanel;
 *   ROVING TABINDEX, so the rail is one Tab stop and ↑/↓ move between panes;
 *   Home / End jump to the ends. That is the pattern a screen-reader user
 *   expects the moment they hear "tab list".
 */

export const PANEL_ID = "coai-lobby-panel";
export const tabDomId = (id: LobbyTabId) => `coai-lobby-tab-${id}`;

export default function LobbyPaneRail({
  tabId,
  onSelect,
}: {
  tabId: LobbyTabId;
  onSelect: (t: LobbyTab) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const move = (to: number) => {
    const i = ((to % LOBBY_TABS.length) + LOBBY_TABS.length) % LOBBY_TABS.length;
    const next = LOBBY_TABS[i];
    onSelect(next);
    // Selection follows focus in a single-select tablist; move the focus too.
    // setTimeout, not rAF — see the note in LobbyOverlay.
    setTimeout(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`#${tabDomId(next.id)}`)?.focus();
    }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = LOBBY_TABS.findIndex((t) => t.id === tabId);
    switch (e.key) {
      case "ArrowDown": case "ArrowRight": e.preventDefault(); move(at + 1); break;
      case "ArrowUp": case "ArrowLeft": e.preventDefault(); move(at - 1); break;
      case "Home": e.preventDefault(); move(0); break;
      case "End": e.preventDefault(); move(LOBBY_TABS.length - 1); break;
      default: break;
    }
  };

  return (
    <nav
      aria-label="Council OS destinations"
      className={`${SURFACE} ${SP.rail} hidden w-52 shrink-0 flex-col sm:flex lg:w-60`}
      style={panelStyle}
    >
      <h2 className={`${TYPE.section} mb-3 shrink-0 px-1`}>Council OS</h2>

      <div
        ref={listRef}
        role="tablist"
        aria-orientation="vertical"
        aria-label="Council OS destinations"
        onKeyDown={onKeyDown}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
      >
        {LOBBY_TABS.map((t) => {
          const on = t.id === tabId;
          const gold = t.accent === "gold";
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
                `w-full shrink-0 rounded-xl px-3.5 py-2 text-left text-[13px] font-semibold transition ` +
                `motion-reduce:transition-none ${FOCUS} ` +
                (on
                  ? gold
                    ? "bg-amber-100 text-amber-900 ring-1 ring-amber-600/40"
                    : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-700/30"
                  : gold
                    ? "text-amber-800 hover:bg-amber-50"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900")
              }
            >
              {t.label}
              {gold && (
                <span className="mt-0.5 block text-[10.5px] font-medium text-amber-800">
                  gold · nothing here is deployed
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className={`shrink-0 pt-4 ${TYPE.fine}`} title="Nothing here is a copy of a page, so nothing here can drift from one.">
        Each pane frames the real route — never a copy of it.
      </p>
    </nav>
  );
}
