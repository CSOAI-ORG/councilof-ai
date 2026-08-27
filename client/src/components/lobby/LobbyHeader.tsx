import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ALPHA_MAX, ALPHA_MIN, FOCUS, HEAD, HEAD_CLOSE, HEAD_CONTROL, HEAD_EDGE, HEAD_FIELD, HEAD_MENU,
  SURFACE, headerGroundStyle,
} from "./glass";
import LobbyPaneTabs, { NAV_ID } from "./LobbyPaneTabs";
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
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
            aria-hidden="true"
          >
            <ColiseumGlyph className="h-[18px] w-[18px]" />
          </span>
          <span id={titleId} className={`hidden sm:block ${HEAD.mark}`}>Council OS</span>
        </span>

        <OsSearchField
          inputRef={searchRef}
          onOpenHit={go}
          disabled={!onSelectTab && !onOpenRoute}
        />

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

/* ─────────────────────────────────────────────────────────────────────────────
 * THE LIVE STATE BAR
 *
 * Three readouts, each one a control that opens the surface behind it, each one
 * carrying its own provenance in `title`: the kind, the source file and the
 * `as_of` the endpoint read out of that file.
 *
 * The board readout quotes `board.public_count` verbatim. That string carries the
 * slot count and the measured count together, and the endpoint publishes it for
 * that reason: the slot number alone is not a measurement, and quoting it alone
 * is the specific overclaim this estate has already had to retract once.
 *
 * The fleet readout prints the reachable count and the catalogued count SIDE BY
 * SIDE and never adds them. They are different kinds — one was contacted and
 * answered, the other has no endpoint and has never been contacted — and adding
 * across kinds is how a fleet of one reachable server got published as 378.
 * ───────────────────────────────────────────────────────────────────────────── */

function LiveStateBar({
  live,
  onOpenHit,
}: {
  live: ReturnType<typeof useLiveState>;
  onOpenHit: (hit: { tab?: LobbyTab; route?: string; label: string }) => void;
}) {
  if (live.phase === "loading") {
    return (
      <span className={`flex items-center gap-2 ${HEAD.fine}`} aria-live="polite">
        <span className={HEAD.key}>Live state</span>
        <span>reading {STATE_ENDPOINT}…</span>
      </span>
    );
  }

  if (live.phase === "failed") {
    // NOT "unmeasured". We failed to read the endpoint; that is a fact about
    // this browser's request, not a published finding about the estate.
    return (
      <span
        className={`flex items-center gap-2 rounded-lg border border-amber-600/30 bg-amber-50 px-2.5 py-1 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200`}
        title={`GET ${STATE_ENDPOINT} did not answer: ${live.error}. No count is shown, because none was read.`}
        role="status"
      >
        <span className={HEAD.key}>Live state</span>
        <span className="font-mono text-[11.5px] leading-none">unreachable — no count read</span>
      </span>
    );
  }

  const { board, fleet, cards, chain } = live.state;
  const grammar = quote(board.countGrammar);

  return (
    // One scrolling line on a phone, where three wrapped rows would eat a third
    // of the screen before the reader saw a pane; wrapped from sm up, where there
    // is room for them all at once.
    <span className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5 sm:w-auto sm:flex-wrap sm:overflow-x-visible sm:pb-0">
      <Readout
        label="Board"
        value={quote(board.publicCount)}
        ok={quotable(board.publicCount)}
        title={
          (grammar !== UNMEASURED ? `${grammar}\n\n` : "") +
          provenance(board.publicCount) +
          "\n\nOpens the living board."
        }
        onClick={() => onOpenHit({ tab: tabOf("board"), label: "Live board" })}
      />
      <Readout
        label="Fleet"
        value={
          quotable(fleet.reachable) || quotable(fleet.catalogued)
            ? `${quote(fleet.reachable)} reachable · ${quote(fleet.catalogued)} catalogued`
            : UNMEASURED
        }
        ok={quotable(fleet.reachable)}
        title={
          "Reachable: servers that answered MCP initialize from the probe host. " +
          "Catalogued: ids with no published endpoint, never contacted.\n" +
          "These are different kinds and are never added together.\n\n" +
          `reachable — ${provenance(fleet.reachable)}\n` +
          `catalogued — ${provenance(fleet.catalogued)}\n\nOpens the published fleet manifest.`
        }
        onClick={() => onOpenHit({ route: "/mcp-fleet", label: "MCP fleet" })}
      />
      {/* This chip said "150 published · 150 signed". /api/state gives that fact
          kind "catalogued" and sources it from card_index.json; it is the curated
          INDEX, not the published set. The chain — which /api/state also publishes,
          and which the Verify pane reads straight off /signed/chain.json — carries
          313 bodies published and 313 verified valid. So the OS read 150 "published"
          one click from a pane reading 313. Neither number was wrong; the WORD was.
          Each figure now carries the word its own fact gives it, and the chain gets
          its own chip rather than being hidden behind the index. */}
      <Readout
        label="Card index"
        value={
          quotable(cards.count)
            ? `${quote(cards.count)} ${cards.count?.kind ?? "listed"} · ${quote(cards.signed)} signed`
            : UNMEASURED
        }
        ok={quotable(cards.count)}
        title={
          "The curated card index, counted from its array rather than read off its header. " +
          "It is NOT the whole published set — see the Chain chip beside it, and never add the two.\n\n" +
          `index — ${provenance(cards.count)}\n` +
          `signed — ${provenance(cards.signed)}\n\nOpens the verifier.`
        }
        onClick={() => onOpenHit({ tab: tabOf("verify"), label: "Verify a card" })}
      />
      <Readout
        label="Chain"
        value={
          quotable(chain.verified) || quotable(chain.positions)
            ? `${quote(chain.verified)} verified · ${quote(chain.positions)} positions`
            : UNMEASURED
        }
        ok={quotable(chain.verified)}
        title={
          "Verified: card bodies whose bytes reproduce their id and whose signature checks out. " +
          "Positions: every link in the chain, including the ones whose body is withheld — " +
          "listed so an absence is never invisible. Different kinds; never added together.\n\n" +
          `verified — ${provenance(chain.verified)}\n` +
          `published — ${provenance(chain.bodiesPublished)}\n` +
          `positions — ${provenance(chain.positions)}\n\nOpens the verifier.`
        }
        onClick={() => onOpenHit({ tab: tabOf("verify"), label: "Verify a card" })}
      />
      <a
        href={STATE_ENDPOINT}
        target="_blank"
        rel="noreferrer"
        title={`Every figure in this bar is read from ${STATE_ENDPOINT} by field name, with the kind and the as_of it was published under. Open it and check.`}
        className={
          `shrink-0 rounded px-1.5 py-1 font-mono text-[11px] leading-none whitespace-nowrap text-emerald-800 underline decoration-dotted underline-offset-2 ` +
          `transition hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200 ` +
          `motion-reduce:transition-none ${FOCUS} dark:focus-visible:ring-offset-slate-950`
        }
      >
        {STATE_ENDPOINT}
      </a>
    </span>
  );
}

function Readout({
  label,
  value,
  ok,
  title,
  onClick,
}: {
  label: string;
  value: string;
  ok: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={
        `inline-flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1 whitespace-nowrap transition motion-reduce:transition-none ` +
        `${FOCUS} dark:focus-visible:ring-offset-slate-950 ` +
        (ok
          ? "border-slate-900/10 bg-white/60 hover:bg-white dark:border-white/12 dark:bg-white/5 dark:hover:bg-white/10"
          : "border-slate-900/12 bg-slate-100 hover:bg-slate-200/70 dark:border-white/12 dark:bg-white/5 dark:hover:bg-white/10")
      }
    >
      <span className={HEAD.key}>{label}</span>
      <span className={ok ? HEAD.val : `${HEAD.val} italic`}>{value}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * SEARCH
 *
 * A WAI-ARIA combobox over the OS's real index (osSearch.ts). Destinations and
 * pages answer from the first keystroke; the board axes and the published signed
 * cards load on first activation, and while they are on the wire the listbox SAYS
 * so — a short list is never passed off as the whole one, and a set that fails is
 * named with its error rather than silently omitted.
 * ───────────────────────────────────────────────────────────────────────────── */

function OsSearchField({
  inputRef,
  onOpenHit,
  disabled,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onOpenHit: (hit: OsHit) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [at, setAt] = useState(0);
  const { results, pending, failures, activate } = useOsSearch(query);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const typed = query.trim().length > 0;
  const open = focused && typed;

  useEffect(() => { setAt(0); }, [query]);

  const groups = useMemo(() => {
    const out: Array<{ group: string; items: Array<{ hit: OsHit; index: number }> }> = [];
    results.forEach((hit, index) => {
      const last = out[out.length - 1];
      if (last && last.group === hit.group) last.items.push({ hit, index });
      else out.push({ group: hit.group, items: [{ hit, index }] });
    });
    return out;
  }, [results]);

  const choose = useCallback(
    (hit: OsHit | undefined) => {
      if (!hit) return;
      onOpenHit(hit);
      setQuery("");
      setFocused(false);
      inputRef.current?.blur();
    },
    [onOpenHit, inputRef],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      // Swallow it while the list is up: Esc should close the list the reader is
      // looking at, not the whole OS behind it. The overlay's window-level
      // handler never sees this one.
      if (open || typed) {
        e.preventDefault();
        e.stopPropagation();
        setQuery("");
        setFocused(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAt((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAt((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setAt(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setAt(results.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[at]);
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <span
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
        aria-hidden="true"
      >
        <IconSearch />
      </span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results.length ? optionId(at) : undefined}
        aria-label="Search Council OS — destinations, board axes and signed cards"
        placeholder="Search destinations, board axes, signed cards"
        value={query}
        disabled={disabled}
        onFocus={() => { setFocused(true); activate(); }}
        // A click on an option must not be cancelled by the blur that precedes
        // it, so the list swallows mousedown and closing is deferred a tick.
        onBlur={() => { setTimeout(() => setFocused(false), 0); }}
        onChange={(e) => { setQuery(e.target.value); activate(); }}
        onKeyDown={onKeyDown}
        className={`${HEAD_FIELD} py-1.5 pl-8 pr-14 text-[12.5px] leading-5 disabled:opacity-50`}
      />
      <kbd
        className={`pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 md:block ${KBD}`}
        aria-hidden="true"
      >
        ⌘K
      </kbd>

      {open && (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-[24rem] overflow-y-auto p-1.5 ${HEAD_MENU}`}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div id={listId} role="listbox" aria-label="Council OS search results">
            {groups.map((g) => (
              <div key={g.group} role="group" aria-label={g.group}>
                <p className={`px-2 pb-1 pt-2 ${HEAD.key}`}>{g.group}</p>
                {g.items.map(({ hit, index }) => (
                  <div
                    key={hit.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === at}
                    onMouseEnter={() => setAt(index)}
                    onClick={() => choose(hit)}
                    className={
                      "cursor-pointer rounded-lg px-2 py-1.5 " +
                      (index === at
                        ? "bg-emerald-100 dark:bg-emerald-400/15"
                        : "hover:bg-slate-900/5 dark:hover:bg-white/10")
                    }
                  >
                    <span className="block text-[12.5px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                      {hit.label}
                    </span>
                    <span className={`block truncate ${HEAD.fine}`}>{hit.detail}</span>
                  </div>
                ))}
              </div>
            ))}

            {results.length === 0 && (
              <p className={`px-2 py-2.5 ${HEAD.fine}`}>
                Nothing in the OS index matches “{query.trim()}”. The index covers this workspace's
                destinations and pages, the live board axes and the published signed cards — nothing else.
              </p>
            )}

            {pending.length > 0 && (
              <p className={`border-t px-2 py-1.5 ${HEAD_EDGE} ${HEAD.fine}`} aria-live="polite">
                Still loading: {pending.join(", ")}. These results are not the whole index yet.
              </p>
            )}
            {failures.map((f) => (
              <p key={f} className={`border-t px-2 py-1.5 ${HEAD_EDGE} ${HEAD.fine}`} role="status">
                Not searchable this session: {f}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
