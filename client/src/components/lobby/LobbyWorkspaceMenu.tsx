import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ALPHA_DEFAULT, ALPHA_MAX, ALPHA_MIN, FOCUS, HEAD, HEAD_CONTROL, HEAD_EDGE, HEAD_MENU,
} from "./glass";
import { LOBBY_TABS, type LobbyTab } from "./tabs";
import { LEFT_DEFAULT, RIGHT_DEFAULT } from "./rails";
import {
  WORKSPACE_FALLBACK, forgetOsPreferences, readWorkspaceName, useActivity, writeWorkspaceName,
} from "./workspace";

/**
 * LobbyWorkspaceMenu — the account menu, without the account.
 *
 * OpenRouter ends its header in an avatar whose menu is Settings / Keys /
 * Activity / Credits. That shape is right; the substance here is different and
 * the menu says so instead of faking it:
 *
 *   IDENTITY   there is no auth backend, so the identity is a LOCAL WORKSPACE —
 *              a name kept in this browser's localStorage. No "Sign in with
 *              Google" that goes nowhere. The caption states the storage truth.
 *   SETTINGS   only preferences the OS actually honors: transparency, window
 *              size, the two rails, the workspace name — the same state the
 *              header controls drive, gathered in one place — plus one honest
 *              reset that forgets everything this browser stored.
 *   ACTIVITY   the OS's own session log (workspace.ts): panes opened and routes
 *              framed IN THIS TAB, held in memory, sent nowhere. The pane says
 *              exactly that, and each entry reopens its destination.
 *   CONNECT    where OpenRouter has API keys, this estate's real integration
 *              surface is its published MCP servers — so the entry opens the
 *              live Tools pane and the fleet manifest, not a key mint.
 */

const relTime = (at: number): string => {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} h ago`;
};

const SECTION = `pt-3 mt-3 border-t ${HEAD_EDGE}`;
const ROW_BTN =
  `flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[12.5px] ` +
  `font-medium text-slate-700 transition hover:bg-slate-900/5 hover:text-slate-900 ` +
  `dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white motion-reduce:transition-none ${FOCUS} ` +
  `dark:focus-visible:ring-offset-slate-950`;

const tabOf = (id: string): LobbyTab | undefined => LOBBY_TABS.find((t) => t.id === id);

export default function LobbyWorkspaceMenu({
  alpha,
  onAlpha,
  size,
  onToggleSize,
  leftOpen,
  onToggleLeft,
  rightOpen,
  onToggleRight,
  onSelectTab,
  onOpenRoute,
}: {
  alpha: number;
  onAlpha: (v: number) => void;
  size: "comfortable" | "full";
  onToggleSize: () => void;
  leftOpen: boolean;
  onToggleLeft: () => void;
  rightOpen: boolean;
  onToggleRight: () => void;
  onSelectTab?: (t: LobbyTab) => void;
  onOpenRoute?: (path: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>(readWorkspaceName);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const activity = useActivity();

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // Outside click closes without stealing the click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const rename = useCallback((v: string) => {
    setName(v);
  }, []);
  const commitName = useCallback(() => {
    const v = name.trim() || WORKSPACE_FALLBACK;
    writeWorkspaceName(v);
    setName(v);
  }, [name]);

  /** Back to defaults, and the browser forgets what it stored. The live state
   *  is walked back through the same callbacks the header controls use, so the
   *  reset is the real state change, not a promise about the next visit. */
  const reset = useCallback(() => {
    forgetOsPreferences();
    onAlpha(ALPHA_DEFAULT);
    if (size !== "full") onToggleSize();
    if (leftOpen !== LEFT_DEFAULT) onToggleLeft();
    if (rightOpen !== RIGHT_DEFAULT) onToggleRight();
    setName(WORKSPACE_FALLBACK);
  }, [onAlpha, size, onToggleSize, leftOpen, onToggleLeft, rightOpen, onToggleRight]);

  const openHit = useCallback(
    (hit: { tab?: LobbyTab; route?: string; label: string }) => {
      if (hit.tab && onSelectTab) onSelectTab(hit.tab);
      else if (hit.route && onOpenRoute) onOpenRoute(hit.route, hit.label);
      close(false);
    },
    [onSelectTab, onOpenRoute, close],
  );

  const initial = (name.trim() || WORKSPACE_FALLBACK).slice(0, 1).toUpperCase();
  const pct = Math.round(alpha * 100);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        title={`${name} — stored in this browser. Settings, activity, MCP connect.`}
        className={`${HEAD_CONTROL} inline-flex h-8 w-8 rounded-full p-0 text-[12.5px] font-bold`}
      >
        <span aria-hidden="true">{initial}</span>
        <span className="sr-only">Workspace menu — {name}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={`${name} — workspace menu`}
          onKeyDown={(e) => {
            // Esc closes the MENU, not the OS behind it.
            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
          }}
          // On a phone the trigger sits mid-header, so a right-anchored 19rem panel
          // would clip off the left edge — below `sm` the panel goes fixed and
          // spans the viewport instead.
          className={`fixed inset-x-3 top-[3.6rem] z-30 max-h-[70vh] overflow-y-auto p-3 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.4rem)] sm:w-[19rem] ${HEAD_MENU}`}
        >
          {/* ── identity, stated truthfully ─────────────────────────────── */}
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[12.5px] font-bold text-white dark:bg-emerald-500 dark:text-emerald-950"
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <label className="block">
                <span className="sr-only">Workspace name</span>
                <input
                  type="text"
                  value={name}
                  maxLength={40}
                  onChange={(e) => rename(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  className={
                    `w-full rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 text-[13px] font-semibold ` +
                    `text-slate-900 hover:border-slate-900/12 dark:text-slate-100 dark:hover:border-white/12 ${FOCUS} ` +
                    `dark:focus-visible:ring-offset-slate-950`
                  }
                />
              </label>
              <p className={`px-1.5 ${HEAD.fine}`}>
                Local workspace — stored in this browser. No account exists; nothing here leaves this device.
              </p>
            </div>
          </div>

          {/* ── settings the OS actually honors ─────────────────────────── */}
          <div className={SECTION}>
            <p className={`px-1.5 pb-1.5 ${HEAD.key}`}>Settings</p>
            <label className="flex items-center justify-between gap-3 px-2 py-1.5">
              <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-300">Transparency</span>
              <span className="flex items-center gap-2">
                <input
                  type="range"
                  min={ALPHA_MIN}
                  max={ALPHA_MAX}
                  step={0.01}
                  value={alpha}
                  onChange={(e) => onAlpha(Number(e.target.value))}
                  aria-label="Panel transparency"
                  aria-valuetext={`${pct}% opaque`}
                  className={`h-1.5 w-24 cursor-pointer accent-emerald-700 dark:accent-emerald-400 ${FOCUS} dark:focus-visible:ring-offset-slate-950`}
                />
                <span className={`${HEAD.val} w-8 text-right`}>{pct}%</span>
              </span>
            </label>
            <button type="button" onClick={onToggleSize} className={ROW_BTN} aria-pressed={size === "full"}>
              <span>Window</span>
              <span className={HEAD.val}>{size === "full" ? "full bleed" : "windowed"}</span>
            </button>
            <button type="button" onClick={onToggleLeft} className={ROW_BTN} aria-pressed={leftOpen}>
              <span>Destinations pane</span>
              <span className={HEAD.val}>{leftOpen ? "shown" : "hidden"}</span>
            </button>
            <button type="button" onClick={onToggleRight} className={ROW_BTN} aria-pressed={rightOpen}>
              <span>Reports rail</span>
              <span className={HEAD.val}>{rightOpen ? "shown" : "hidden"}</span>
            </button>
            <button
              type="button"
              onClick={reset}
              className={ROW_BTN}
              title="Returns transparency, window size, rails and the workspace name to their defaults, and removes every Council OS preference this browser stored."
            >
              <span>Reset &amp; forget stored preferences</span>
            </button>
          </div>

          {/* ── activity: this session, this tab, nothing else ──────────── */}
          <div className={SECTION}>
            <p className={`px-1.5 pb-0.5 ${HEAD.key}`}>Activity</p>
            <p className={`px-1.5 pb-1.5 ${HEAD.fine}`}>
              This session only — recorded in this tab while the OS is open, kept in memory, sent nowhere.
            </p>
            {activity.length === 0 ? (
              <p className={`px-2 py-1 ${HEAD.fine}`}>Nothing yet — open a pane and it appears here.</p>
            ) : (
              activity.slice(0, 8).map((e) => (
                <button
                  key={`${e.at}-${e.label}`}
                  type="button"
                  onClick={() => openHit({ tab: e.tabId ? tabOf(e.tabId) : undefined, route: e.path, label: e.label })}
                  className={ROW_BTN}
                >
                  <span className="min-w-0 truncate">{e.label}</span>
                  <span className={`shrink-0 ${HEAD.fine}`}>{relTime(e.at)}</span>
                </button>
              ))
            )}
          </div>

          {/* ── connect: the real integration surface, not a key mint ───── */}
          <div className={SECTION}>
            <p className={`px-1.5 pb-1.5 ${HEAD.key}`}>Connect</p>
            <button
              type="button"
              onClick={() => openHit({ tab: tabOf("tools"), label: "Tools" })}
              className={ROW_BTN}
              title="Published tooling and MCP servers — install and connect from the Tools pane."
            >
              <span>MCP servers — install &amp; connect</span>
            </button>
            <button
              type="button"
              onClick={() => openHit({ route: "/mcp-fleet", label: "MCP fleet" })}
              className={ROW_BTN}
              title="The published fleet manifest — what is reachable, what is only catalogued."
            >
              <span>Fleet manifest</span>
            </button>
            <p className={`px-1.5 pt-1 ${HEAD.fine}`}>
              There are no API keys here — verification is free and needs no account.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
