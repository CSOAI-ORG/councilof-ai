import { useRef } from "react";
import { LOBBY_TABS, type LobbyTab, type LobbyTabId } from "./tabs";
import { FOCUS } from "./glass";

/**
 * LobbyPaneTabs — shared WAI-ARIA tablist for Council OS destinations.
 *
 * Used vertically in the left rail (desktop) and horizontally in the header
 * (mobile / OpenRouter-style). One instance is mounted at a time so tab ids
 * stay unique. Roving tabindex, arrow keys, Home/End — same contract as the
 * side rail's section switcher.
 */

export const PANEL_ID = "coai-lobby-panel";
export const NAV_ID = "navigation";
export const tabDomId = (id: LobbyTabId) => `coai-lobby-tab-${id}`;

export default function LobbyPaneTabs({
  tabId,
  onSelect,
  orientation,
  override = false,
  variant = "rail",
  className = "",
}: {
  tabId: LobbyTabId;
  onSelect: (t: LobbyTab) => void;
  orientation: "vertical" | "horizontal";
  /** When a non-pane route is open, no tab is selected. */
  override?: boolean;
  variant?: "rail" | "chip";
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const horizontal = orientation === "horizontal";

  const move = (to: number) => {
    const i = ((to % LOBBY_TABS.length) + LOBBY_TABS.length) % LOBBY_TABS.length;
    const next = LOBBY_TABS[i];
    onSelect(next);
    setTimeout(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`#${tabDomId(next.id)}`)?.focus();
    }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = LOBBY_TABS.findIndex((t) => t.id === tabId);
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        if ((e.key === "ArrowDown" && !horizontal) || (e.key === "ArrowRight" && horizontal)) {
          e.preventDefault();
          move(at + 1);
        }
        break;
      case "ArrowUp":
      case "ArrowLeft":
        if ((e.key === "ArrowUp" && !horizontal) || (e.key === "ArrowLeft" && horizontal)) {
          e.preventDefault();
          move(at - 1);
        }
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(LOBBY_TABS.length - 1);
        break;
      default:
        break;
    }
  };

  const listClass =
    variant === "chip"
      ? `flex gap-1.5 overflow-x-auto ${className}`
      : `flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto ${className}`;

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      aria-label="Council OS destinations"
      onKeyDown={onKeyDown}
      className={listClass}
    >
      {LOBBY_TABS.map((t) => {
        const on = !override && t.id === tabId;
        const gold = t.accent === "gold";
        const chip =
          variant === "chip"
            ? `shrink-0 rounded-full px-3 py-1 text-[11.5px] font-semibold transition motion-reduce:transition-none ${FOCUS} ` +
              (on
                ? gold
                  ? "bg-amber-100 text-amber-900"
                  : "bg-emerald-100 text-emerald-900"
                : "text-slate-600")
            : `w-full shrink-0 rounded-xl px-3.5 py-2 text-left text-[13px] font-semibold transition motion-reduce:transition-none ${FOCUS} ` +
              (on
                ? gold
                  ? "bg-amber-100 text-amber-900 ring-1 ring-amber-600/40"
                  : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-700/30"
                : gold
                  ? "text-amber-800 hover:bg-amber-50"
                  : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900");

        return (
          <button
            key={t.id}
            id={tabDomId(t.id)}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={PANEL_ID}
            tabIndex={on || (override && t.id === tabId) ? 0 : -1}
            onClick={() => onSelect(t)}
            className={chip}
          >
            {t.label}
            {gold && variant === "rail" && (
              <span className="mt-0.5 block text-[10.5px] font-medium text-amber-800">
                Local play · in build
              </span>
            )}
            {/* A destination behind RequireAuth says so on the rail, BEFORE the click.
                Without this the reader picks "Workbench" and lands on a password box. */}
            {t.auth === "required" && variant === "rail" && (
              <span className="mt-0.5 block text-[10.5px] font-medium text-slate-600">
                Needs an account
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
