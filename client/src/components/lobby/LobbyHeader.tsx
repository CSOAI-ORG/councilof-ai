import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ALPHA_MAX, ALPHA_MIN, FOCUS, HEAD, HEAD_CLOSE, HEAD_CONTROL, HEAD_EDGE, HEAD_FIELD, HEAD_MENU,
  SURFACE, headerGroundStyle,
} from "./glass";
import LobbyPaneTabs, { NAV_ID } from "./LobbyPaneTabs";
import LobbyWorkspaceMenu from "./LobbyWorkspaceMenu";
import { LOBBY_TABS, type LobbyTab, type LobbyTabId } from "./tabs";
import { useOsSearch, type OsHit } from "./osSearch";
import { UNMEASURED, provenance, quotable, quote, useLiveState, STATE_ENDPOINT } from "./liveState";

/**
 * LobbyHeader — the Council OS utility bar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS REPLACED, AND WHY
 *
 * The bar used to open with the name and the line "Measure · sign · check — not
 * certification". Three verbs and a disclaimer: nothing an operator can act on,
 * nothing anyone can check, and no reason to read it twice. It also spent the
 * widest, most valuable strip on the screen saying what we are not.
 *
 * This is a measurement instrument, so the header is now a DENSE UTILITY BAR:
 * search first, short concrete navigation, and the live state printed as data.
 * It assumes the visitor came to do something and puts the doing one click away.
 * Nothing in it is a slogan.
 *
 *   row 1  the mark · SEARCH (the widest thing in the bar) · window controls
 *   row 2  four destinations you can open · the live state · the panes, the
 *          rail and the transparency control
 *   row 3  the destination tablist, on narrow viewports only (the left rail is
 *          hidden there, and only ONE tablist is ever mounted)
 *   row 4  the shortcuts, printed rather than left to be discovered
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EVERY NUMBER IN THIS FILE IS DERIVED. There is no count typed anywhere below.
 * The readouts come from `GET /api/state` by field name (see liveState.ts), and
 * the board's is quoted VERBATIM from the sentence that endpoint publishes for
 * exactly this purpose — it carries the slot count and the measured count
 * together, which is the only honest way to say either of them. `unmeasured` is
 * printed as a word when that is the published status; a bar that cannot reach
 * the endpoint says so, and does NOT borrow the word `unmeasured` to describe
 * its own network failure.
 *
 * SEARCH IS REAL. It resolves the OS's own destinations and pages immediately,
 * and — on first use — the live board axes and the published signed cards. Every
 * result opens something. See osSearch.ts.
 *
 * BOTH THEMES. The ground is one variable (`--lobby-ground`) composited with the
 * transparency slider's `--lobby-alpha`, so light and dark are both correct and
 * the slider works in each. See the header block in glass.ts.
 *
 * KEYBOARD. ⌘/Ctrl K focuses search from anywhere in the OS; ↑ ↓ move through
 * results, Enter opens, Esc closes the list (and only then the OS). Every control
 * carries a visible focus ring and a name.
 */

export function ColiseumGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9a9 5 0 0 1 18 0" />
      <path d="M3 9v9" /><path d="M21 9v9" />
      <path d="M7.5 9.6v8.4" /><path d="M12 9.9v8.1" /><path d="M16.5 9.6v8.4" />
      <path d="M2.5 18h19" />
      <path d="M9.6 18v-3.2a2.4 2.4 0 0 1 4.8 0V18" />
    </svg>
  );
}

const ICON = "h-4 w-4 shrink-0";

function IconMinimise() {
  return (
    <svg viewBox="0 0 16 16" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" aria-hidden="true"><path d="M3.5 11.5h9" /></svg>
  );
}
function IconExpand() {
  return (
    <svg viewBox="0 0 16 16" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2.5H2.5V6" /><path d="M10 13.5h3.5V10" />
      <path d="M13.5 6V2.5H10" /><path d="M2.5 10v3.5H6" />
    </svg>
  );
}
function IconRestore() {
  return (
    <svg viewBox="0 0 16 16" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 6H6V2.5" /><path d="M13.5 10H10v3.5" />
      <path d="M10 2.5V6h3.5" /><path d="M6 13.5V10H2.5" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 16 16" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" /><path d="M10.2 10.2 14 14" />
    </svg>
  );
}

const KBD =
  "rounded border border-slate-900/15 bg-white px-1 font-mono text-[10px] text-slate-700 " +
  "dark:border-white/15 dark:bg-white/10 dark:text-slate-200";

const tabOf = (id: LobbyTabId): LobbyTab | undefined => LOBBY_TABS.find((t) => t.id === id);

/**
 * Compare two in-pane paths.
 *
 * The framed page reports the path it actually landed on, and the site's
 * `_redirects` add a trailing slash (`/methodology` → 308 `/methodology/`). A raw
 * `===` therefore never matched after a redirect, and a nav noun that HAD opened
 * the pane still failed to mark itself current.
 */
const samePath = (a?: string, b?: string): boolean => {
  const norm = (p?: string) => (p ?? "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return Boolean(a) && Boolean(b) && norm(a) === norm(b);
};

/**
 * The four destinations the bar names.
 *
 * Nouns, not adjectives: each one is a thing you open, and each is the surface
 * that answers one of the four questions this instrument exists to answer —
 * what was measured, how, how you check it yourself, and what we got wrong.
 * They are shortcuts to destinations the rail already owns, so they are plain
 * buttons and NOT a second `role="tablist"`; the OS mounts exactly one tablist
 * at a time and that contract is not worth breaking for a shortcut.
 */
const NAV: Array<{ label: string; title: string; tab?: LobbyTabId; route?: string }> = [
  { label: "Board", tab: "board", title: "The living board — every published axis, measured and unmeasured alike" },
  { label: "Method", route: "/methodology", title: "How a run is graded — deterministic, with no model in the verdict" },
  { label: "Verifier", tab: "verify", title: "Recompute a record's hash and check its signature in your browser" },
  { label: "Ledger", route: "/refutation-ledger", title: "Killed hypotheses, with the artefacts that killed them" },
];

export default function LobbyHeader({
  titleId,
  alpha,
  onAlpha,
  size,
  onToggleSize,
  onMinimise,
  onClose,
  leftOpen,
  onToggleLeft,
  rightOpen,
  onToggleRight,
  showHeaderNav,
  tabId,
  onSelectTab,
  onOpenRoute,
  activePath,
  navOverride,
  windowed = true,
}: {
  titleId: string;
  alpha: number;
  onAlpha: (v: number) => void;
  size: "comfortable" | "full";
  onToggleSize: () => void;
  onMinimise: () => void;
  onClose: () => void;
  leftOpen: boolean;
  onToggleLeft: () => void;
  rightOpen: boolean;
  onToggleRight: () => void;
  /** Horizontal destination tablist in the header (narrow viewports). */
  showHeaderNav?: boolean;
  tabId?: LobbyTabId;
  onSelectTab?: (t: LobbyTab) => void;
  /** Frame a live route in the centre pane — search results and the nav nouns. */
  onOpenRoute?: (path: string, label: string) => void;
  /** The path actually showing in the pane, so a nav noun can mark itself current. */
  activePath?: string;
  navOverride?: boolean;
  /** Overlay window controls (expand / minimise / close). Off on the /os page. */
  windowed?: boolean;
}) {
  const pct = Math.round(alpha * 100);
  const live = useLiveState();
  const searchRef = useRef<HTMLInputElement>(null);

  const go = useCallback(
    (hit: { tab?: LobbyTab; route?: string; label: string }) => {
      if (hit.tab && onSelectTab) { onSelectTab(hit.tab); return; }
      if (hit.route && onOpenRoute) onOpenRoute(hit.route, hit.label);
    },
    [onSelectTab, onOpenRoute],
  );

  // ⌘/Ctrl K from anywhere in the OS. The overlay's own shortcuts already skip
  // keystrokes aimed at a field, so search and the rail toggles do not collide.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`${SURFACE} relative z-20 flex w-full flex-col`}
      style={headerGroundStyle}
    >
      {/* ── row 1 · the bar ─────────────────────────────────────────────── */}
      <div className="flex w-full items-center gap-3 px-4 py-2.5">
        <span className="flex shrink-0 items-center gap-2.5">
          {windowed ? (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
              aria-hidden="true"
            >
              <ColiseumGlyph className="h-[18px] w-[18px]" />
            </span>
          ) : null}
          <span id={titleId} className={windowed ? `hidden sm:block ${HEAD.mark}` : "sr-only"}>
            Council OS
          </span>
        </span>

        <OsSearchField
          inputRef={searchRef}
          onOpenHit={go}
          disabled={!onSelectTab && !onOpenRoute}
        />

        {/* The workspace menu — the honest account surface. See LobbyWorkspaceMenu. */}
        <LobbyWorkspaceMenu
          alpha={alpha}
          onAlpha={onAlpha}
          size={size}
          onToggleSize={onToggleSize}
          leftOpen={leftOpen}
          onToggleLeft={onToggleLeft}
          rightOpen={rightOpen}
          onToggleRight={onToggleRight}
          onSelectTab={onSelectTab}
          onOpenRoute={onOpenRoute}
        />

        {windowed && (
        <span className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSize}
            aria-label={size === "full" ? "Restore Council OS to a windowed size" : "Expand Council OS to fill the screen"}
            title={size === "full" ? "Restore" : "Expand"}
            className={`${HEAD_CONTROL} inline-flex px-2.5 py-1.5 text-[12px] font-semibold`}
          >
            {size === "full" ? <IconRestore /> : <IconExpand />}
            <span className="hidden lg:inline">{size === "full" ? "Restore" : "Expand"}</span>
          </button>

          <button
            type="button"
            onClick={onMinimise}
            aria-label="Minimise Council OS, keeping this session"
            title="Minimise (Cmd/Ctrl + .)"
            className={`${HEAD_CONTROL} inline-flex px-2.5 py-1.5 text-[12px] font-semibold`}
          >
            <IconMinimise />
            <span className="hidden lg:inline">Minimise</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Council OS"
            title="Close (Esc)"
            className={`${HEAD_CLOSE} px-2.5 py-1.5 text-[12px] font-semibold`}
          >
            <IconClose />
            <span className="hidden lg:inline">Close</span>
          </button>
        </span>
        )}
      </div>

      {/* ── row 2 · destinations, live state, workspace controls ─────────── */}
      <div className={`flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-t ${HEAD_EDGE} px-4 py-2`}>
        <nav aria-label="Council OS shortcuts" className="hidden items-center gap-1 sm:flex">
          {NAV.map((n) => {
            const current = n.tab
              ? !navOverride && tabId === n.tab
              : samePath(activePath, n.route);
            return (
              <button
                key={n.label}
                type="button"
                title={n.title}
                aria-current={current ? "true" : undefined}
                onClick={() => go({ tab: n.tab ? tabOf(n.tab) : undefined, route: n.route, label: n.label })}
                className={
                  `rounded-lg px-2.5 py-1 transition motion-reduce:transition-none ${FOCUS} ` +
                  `dark:focus-visible:ring-offset-slate-950 ${HEAD.nav} ` +
                  (current
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200"
                    : "hover:bg-slate-900/5 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white")
                }
              >
                {n.label}
              </button>
            );
          })}
        </nav>

        <LiveStateBar live={live} onOpenHit={go} />

        <span className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleLeft}
            aria-expanded={leftOpen}
            aria-label={leftOpen ? "Hide the destinations pane" : "Show the destinations pane"}
            title="Destinations ([)"
            className={`${HEAD_CONTROL} hidden px-2.5 py-1 text-[12px] font-semibold sm:inline-flex`}
          >
            {leftOpen ? "Hide panes" : "Show panes"}
          </button>
          <button
            type="button"
            onClick={onToggleRight}
            aria-expanded={rightOpen}
            aria-label={rightOpen ? "Hide the reports rail" : "Show the reports rail"}
            title="Reports rail (])"
            className={`${HEAD_CONTROL} hidden px-2.5 py-1 text-[12px] font-semibold lg:inline-flex`}
          >
            {rightOpen ? "Hide rail" : "Show rail"}
          </button>

          <label className="flex items-center gap-2">
            <span className={`hidden xl:inline ${HEAD.key}`}>Transparency</span>
            <input
              type="range"
              min={ALPHA_MIN}
              max={ALPHA_MAX}
              step={0.01}
              value={alpha}
              onChange={(e) => onAlpha(Number(e.target.value))}
              aria-label="Panel transparency"
              aria-valuetext={`${pct}% opaque`}
              className={`h-1.5 w-20 cursor-pointer accent-emerald-700 sm:w-28 dark:accent-emerald-400 ${FOCUS} dark:focus-visible:ring-offset-slate-950`}
            />
            {/* pct stays in aria-valuetext above; it does not need a visible slot. */}
          </label>
        </span>
      </div>

      {/* ── row 3 · the destination tablist, narrow viewports only ───────── */}
      {showHeaderNav && tabId && onSelectTab && (
        <nav
          id={NAV_ID}
          aria-label="Council OS destinations"
          className={`w-full border-t ${HEAD_EDGE} px-4 py-2 sm:hidden`}
          tabIndex={-1}
        >
          <LobbyPaneTabs
            tabId={tabId}
            onSelect={onSelectTab}
            orientation="horizontal"
            override={navOverride}
            variant="chip"
            className="pb-0.5"
          />
        </nav>
      )}

      {/* ── row 4 · the shortcuts, on demand ────────────────────────────
          These were printed permanently across the foot of the bar: six shortcuts, always
          on screen, read once and then furniture forever. A reference belongs where someone
          goes looking for it, not in the space a live readout could use. The shortcuts all
          still work; this is a disclosure, so the keys are discoverable without being
          resident. Native <details> so it needs no state and stays keyboard-reachable. */}
      <details className={`hidden w-full border-t sm:block ${HEAD_EDGE}`}>
        <summary
          className={`cursor-pointer list-none px-4 py-1 ${HEAD.fine} ${FOCUS} hover:text-slate-700 dark:hover:text-slate-200`}
          title="Keyboard shortcuts"
        >
          <kbd className={KBD}>?</kbd> shortcuts
        </summary>
        <p className={`px-4 pb-1.5 ${HEAD.fine}`}>
          <kbd className={KBD}>⌘/Ctrl K</kbd> search ·{" "}
          <kbd className={KBD}>Esc</kbd> close ·{" "}
          <kbd className={KBD}>[</kbd> panes ·{" "}
          <kbd className={KBD}>]</kbd> rail ·{" "}
          <kbd className={KBD}>⌘/Ctrl .</kbd> minimise ·{" "}
          <kbd className={KBD}>↑ ↓</kbd> panes
        </p>
      </details>
    </header>
  );
}
