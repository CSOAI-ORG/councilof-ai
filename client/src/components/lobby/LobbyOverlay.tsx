import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TAB, LOBBY_TABS, tabById, type LobbyTab, type LobbyTabId } from "./tabs";
import LobbyHeader, { ColiseumGlyph } from "./LobbyHeader";
import LobbyPaneRail, { PANEL_ID, tabDomId } from "./LobbyPaneRail";
import LobbySideRail from "./LobbySideRail";
import LobbyComposer from "./LobbyComposer";
import LobbyThread from "./LobbyThread";
import LobbyBoardPane from "./LobbyBoardPane";
import LobbyVerifyPane from "./LobbyVerifyPane";
import LobbyPlay from "./LobbyPlay";
import LobbyHome from "./LobbyHome";
import { useLobbyChat } from "./useLobbyChat";
import { useFocusTrap } from "./useFocusTrap";
import {
  ALPHA_DEFAULT, ALPHA_MAX, ALPHA_MIN, FOCUS, SP, SURFACE, SURFACE_LIFTED, TYPE,
  panelStyle, scrimStyle,
} from "./glass";
import { LOBBY_TASKS, type LobbyIntent } from "@/lib/lobbyLink";
import { isEmbedNav, tabForPath, withEmbed } from "@/lib/embed";
import { setOsOpen } from "@/lib/osChrome";
import {
  LEFT_DEFAULT, LEFT_KEY, RIGHT_DEFAULT, RIGHT_KEY, readOpen, writeOpen,
} from "./rails";
import { useNarrowViewport } from "./useNarrowViewport";

/**
 * LobbyOverlay — the Council Lobby as a WHITE GLASS-OS workspace.
 *
 * THE GROUND IS WHITE. A near-opaque white scrim + backdrop blur washes the page
 * out behind the lobby; the panels are translucent white on top of that, edged
 * with a hairline and lifted with a soft shadow. Emerald is the accent on every
 * measurement surface; gold is reserved for the local-play gallery, so the two
 * can never be confused. All of it — scrim and panels alike — is driven by the
 * single `--lobby-alpha` custom property the transparency slider writes, exactly
 * as before; it now targets the white ground instead of the old dark one. See
 * glass.ts for the floor that keeps text above WCAG AA at every setting.
 *
 * THE LAYOUT.
 *   header   full width, at the very top — the mark, the name, transparency and
 *            the window controls. NOT inside the centre pane.
 *   left     Destinations — a real vertical tablist. Hideable; `[` toggles it.
 *   centre   the dominant column: the live pane PLUS the ask thread. This is
 *            the readable surface. Hiding both rails gives it the workspace.
 *   right    Reports · Tasks · Chats. Hideable; `]` toggles it. Closed on a
 *            first visit so the centre reads first.
 *
 * WINDOW STATE. close / minimise / expand-restore.
 *   Esc closes and focus returns to the badge (see CouncilLobby).
 *   Cmd/Ctrl + . minimises to a docked bar. MINIMISING KEEPS THE SESSION: this
 *   component stays mounted, so the open pane, the alpha, the audience and the
 *   entire chat thread survive untouched. Only the presentation collapses.
 *   Expand/restore switches between a comfortable inset window and full bleed.
 *
 * ACCESSIBILITY. role="dialog" + aria-modal + aria-labelledby on the header
 * title; a focus trap with sentinels either side (the centre pane is an iframe,
 * so a keydown-only trap would leak); focus moves to the selected pane tab on
 * open and back to the trigger on close; both rails are proper tablists with
 * roving tabindex and arrow-key navigation; the chat log is an aria-live region;
 * every state is carried by a word, not only by a colour; all motion is behind
 * `motion-safe`. While minimised the surface is no longer modal — aria-modal is
 * dropped, the trap is off and the page scrolls again, which is the honest
 * description of a docked window.
 */

const ALPHA_KEY = "coai.lobby.alpha";
const TAB_KEY = "coai.lobby.tab";
const SIZE_KEY = "coai.lobby.size";
const TITLE_ID = "coai-lobby-title";

function readAlpha(): number {
  try {
    const v = Number(localStorage.getItem(ALPHA_KEY));
    if (Number.isFinite(v) && v >= ALPHA_MIN && v <= ALPHA_MAX) return v;
  } catch { /* private mode / storage disabled — the default is fine */ }
  return ALPHA_DEFAULT;
}

function readTab(): LobbyTabId {
  try {
    const v = localStorage.getItem(TAB_KEY);
    if (v && LOBBY_TABS.some((t) => t.id === v)) return v as LobbyTabId;
  } catch { /* ignore */ }
  return DEFAULT_TAB;
}

function readSize(): "comfortable" | "full" {
  try {
    const v = localStorage.getItem(SIZE_KEY);
    if (v === "comfortable" || v === "full") return v;
  } catch { /* ignore */ }
  return "full";
}

/** Tabbable guard that bounces focus back into the dialog. See useFocusTrap. */
function FocusSentinel({ onFocus }: { onFocus: () => void }) {
  return <div data-focus-sentinel tabIndex={0} aria-hidden="true" onFocus={onFocus} className="sr-only" />;
}

export default function LobbyOverlay({
  onClose,
  intent,
}: {
  onClose: () => void;
  intent?: LobbyIntent | null;
}) {
  const [alpha, setAlpha] = useState<number>(readAlpha);
  // An intent present at mount picks the pane; otherwise the last pane is restored.
  const [tabId, setTabId] = useState<LobbyTabId>(() => intent?.pane ?? readTab());
  const [leftOpen, setLeftOpen] = useState(() => readOpen(LEFT_KEY, LEFT_DEFAULT));
  const [rightOpen, setRightOpen] = useState(() => readOpen(RIGHT_KEY, RIGHT_DEFAULT));
  const [size, setSize] = useState<"comfortable" | "full">(readSize);
  const [minimised, setMinimised] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  /** Set when a play card opens a route that is not itself a pane. */
  const [override, setOverride] = useState<{ path: string; label: string } | null>(null);
  /** Actual path showing in the iframe — follows in-pane navigation. */
  const [framePath, setFramePath] = useState<string>(() => intent ? tabById(intent.pane).path : tabById(readTab()).path);
  const [frameSrc, setFrameSrc] = useState<string>(() => {
    const path = intent ? tabById(intent.pane).path : tabById(readTab()).path;
    return path ? withEmbed(path) : "";
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const chat = useLobbyChat();
  const tab = tabById(tabId);
  const narrow = useNarrowViewport();
  const modal = !minimised;
  const focusEdge = useFocusTrap(rootRef, modal);

  useEffect(() => { try { localStorage.setItem(ALPHA_KEY, String(alpha)); } catch { /* ignore */ } }, [alpha]);
  useEffect(() => { try { localStorage.setItem(TAB_KEY, tabId); } catch { /* ignore */ } }, [tabId]);
  useEffect(() => { try { localStorage.setItem(SIZE_KEY, size); } catch { /* ignore */ } }, [size]);
  useEffect(() => { writeOpen(LEFT_KEY, leftOpen); }, [leftOpen]);
  useEffect(() => { writeOpen(RIGHT_KEY, rightOpen); }, [rightOpen]);

  // Hide marketing Header/Footer while the workspace covers the page.
  // Minimising (or unmounting) returns the public site chrome.
  useEffect(() => {
    setOsOpen(!minimised);
    return () => setOsOpen(false);
  }, [minimised]);

  const minimise = useCallback(() => setMinimised(true), []);

  // Esc closes; Cmd/Ctrl + . minimises. Both are printed in the header.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "." && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setMinimised((m) => !m); return; }
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "[") { e.preventDefault(); setLeftOpen((v) => !v); return; }
      if (e.key === "]") { e.preventDefault(); setRightOpen((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The page behind must not scroll while the lobby is OVER it. Minimised, the
  // lobby is a docked bar, not a modal — so the page gets its scroll back.
  useEffect(() => {
    if (minimised) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [minimised]);

  // Focus lands on the selected pane tab when the lobby opens or is restored —
  // a sensible first control, and it announces the tablist.
  //
  // EXCEPT when a deep link seeded a question: the chat bar is then the thing
  // the reader was sent here for, so it takes the focus (and the bar puts the
  // caret at the end of the seeded text). Whoever wins that race would otherwise
  // decide it, which is not a contract.
  useEffect(() => {
    if (minimised) return;
    if (intent?.prompt?.trim()) return;
    // setTimeout, not requestAnimationFrame: rAF is throttled to zero in a
    // background or non-compositing tab, and focus placement must not depend on
    // the tab being painted.
    const t = setTimeout(() => {
      const el = document.getElementById(tabDomId(tabId)) as HTMLButtonElement | null;
      (el ?? rootRef.current)?.focus();
    }, 0);
    return () => clearTimeout(t);
    // Only on open / restore, not on every pane change (the rail moves focus itself).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimised]);

  const loadPane = useCallback((path: string) => {
    setFrameLoaded(false);
    setFramePath(path);
    setFrameSrc(path ? withEmbed(path) : "");
  }, []);

  // A later intent (an in-page CTA fired while the lobby is already open) moves
  // the pane. `nonce` makes a repeat of the same request land again.
  useEffect(() => {
    if (!intent) return;
    setMinimised(false);
    const next = tabById(intent.pane);
    setTabId(intent.pane);
    if (intent.route) {
      setOverride({ path: intent.route, label: intent.task ? LOBBY_TASKS[intent.task].label : intent.route });
      loadPane(intent.route);
      return;
    }
    setOverride(null);
    if (next.kind !== "local" && next.kind !== "native" && next.path) loadPane(next.path);
  }, [intent?.nonce, intent?.pane, intent?.route, loadPane, intent?.task]);

  const go = useCallback((t: LobbyTab) => {
    setOverride(null);
    setTabId(t.id);
    if (t.kind === "local" || t.kind === "native") {
      // Clear the previous iframe's path so the pane header chip never shows
      // the last tab's URL under a native/local pane.
      setFramePath("");
      return;
    }
    if (t.path) loadPane(t.path);
  }, [loadPane]);

  const openRoute = useCallback((path: string, label: string) => {
    setOverride({ path, label });
    loadPane(path);
  }, [loadPane]);

  // In-pane clicks stay in the iframe and post `coai:embed-nav`. Follow the
  // path in the rail without remounting the frame (that would flash and lose
  // scroll). Lobby-chrome navigation still remounts via loadPane().
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!isEmbedNav(e.data)) return;
      const path = e.data.path;
      const matched = tabForPath(path);
      setFramePath(path);
      if (matched) {
        setTabId(matched.id);
        setOverride(null);
      } else {
        setOverride({ path, label: e.data.title || path });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // The framed page is same-origin, so Esc pressed INSIDE it can still close the
  // lobby. Without this, focus in the frame would swallow the shortcut.
  const onFrameLoad = useCallback(() => {
    setFrameLoaded(true);
    try {
      const doc = frameRef.current?.contentDocument;
      doc?.addEventListener("keydown", (e: any) => { if (e.key === "Escape") onClose(); });
    } catch { /* cross-origin or blocked — the outer Esc still works */ }
  }, [onClose]);

  const localPane = !override && tab.kind === "local";
  const nativePane = !override && tab.kind === "native";
  const panePath = framePath || override?.path || tab.path;
  const paneLabel = override ? override.label : tab.label;
  const chatActive = chat.turnCount > 0;

  useEffect(() => {
    if (!chatActive) return;
    requestAnimationFrame(() => threadEndRef.current?.scrollIntoView({ block: "end" }));
  }, [chat.turnCount, chatActive]);

  // ── docked (minimised) ─────────────────────────────────────────────────────────
  if (minimised) {
    return (
      <div
        role="dialog"
        aria-label="Council OS, minimised"
        className={`fixed bottom-5 left-1/2 z-[80] w-[min(30rem,calc(100vw-2.5rem))] -translate-x-1/2 ${SURFACE_LIFTED} ${SP.row} flex items-center gap-3 bg-white/95 backdrop-blur-xl`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white" aria-hidden="true">
          <ColiseumGlyph className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold leading-tight text-slate-900">
            Council OS — minimised
          </span>
          <span className={`block ${TYPE.fine}`}>
            {paneLabel} · {chat.turnCount} message{chat.turnCount === 1 ? "" : "s"} kept ·{" "}
            {chat.threads.length} thread{chat.threads.length === 1 ? "" : "s"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setMinimised(false)}
          aria-label="Restore Council OS"
          className={`ml-auto shrink-0 rounded-xl bg-emerald-700 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-emerald-800 motion-reduce:transition-none ${FOCUS}`}
        >
          Restore
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Council OS"
          className={`shrink-0 rounded-xl border border-slate-900/12 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
        >
          Close
        </button>
      </div>
    );
  }

  // ── the workspace ────────────────────────────────────────────────────
  return (
    <>
      <FocusSentinel onFocus={() => focusEdge("last")} />
      <div
        ref={rootRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        data-coai="Council Lobby"
        className={
          `fixed z-[80] flex flex-col ${SP.shell} outline-none backdrop-blur-2xl ` +
          (size === "full" ? "inset-0" : "inset-2 rounded-3xl sm:inset-4")
        }
        style={{
          // The slider drives this; every panel inherits it.
          ["--lobby-alpha" as any]: String(alpha),
          ...scrimStyle(alpha),
        }}
      >
        <LobbyHeader
          titleId={TITLE_ID}
          alpha={alpha}
          onAlpha={setAlpha}
          size={size}
          onToggleSize={() => setSize((s) => (s === "full" ? "comfortable" : "full"))}
          onMinimise={minimise}
          onClose={onClose}
          leftOpen={leftOpen}
          onToggleLeft={() => setLeftOpen((v) => !v)}
          rightOpen={rightOpen}
          onToggleRight={() => setRightOpen((v) => !v)}
          showHeaderNav={narrow}
          tabId={tabId}
          onSelectTab={go}
          navOverride={!!override}
        />

        {/* ── three rails; centre (pane + ask) is the dominant column ───── */}
        <div className="flex min-h-0 flex-1 gap-3">
          {!narrow && leftOpen ? (
            <LobbyPaneRail
              tabId={tabId}
              onSelect={go}
              onMinimise={() => setLeftOpen(false)}
              override={!!override}
            />
          ) : (
            <RailRestore
              className="hidden sm:flex"
              label="Show the destinations pane"
              text="Panes"
              onClick={() => setLeftOpen(true)}
            />
          )}

          <main
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={tabDomId(tabId)}
            className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/60 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-14px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5"
            style={panelStyle}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-900/10 px-5 py-2.5">
              <span className="text-[12.5px] font-semibold text-slate-900">{paneLabel}</span>
              <span className={`hidden truncate md:inline ${TYPE.fine}`}>
                {override ? "Opened in this pane — navigation stays inside the OS." : tab.blurb}
              </span>
              {panePath && (
                <span
                  className="ml-auto shrink-0 rounded font-mono text-[11px] text-slate-500"
                  title="This page is open in the lobby pane — navigation stays here"
                >
                  {panePath}
                </span>
              )}
              {override && (
                <button
                  type="button"
                  onClick={() => { setOverride(null); if (tab.path) loadPane(tab.path); }}
                  className={`shrink-0 rounded-lg border border-slate-900/10 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
                >
                  Back to {tab.label}
                </button>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className={
                  `relative min-h-0 overflow-hidden ${chatActive ? "flex-[0_1_40%]" : "flex-1"}`
                }
              >
                {localPane && tab.id === "home" ? (
                  <LobbyHome onSelect={go} onOpenRoute={openRoute} />
                ) : localPane ? (
                  <LobbyPlay onOpenRoute={openRoute} />
                ) : nativePane && tab.id === "board" ? (
                  <LobbyBoardPane />
                ) : nativePane && tab.id === "verify" ? (
                  <LobbyVerifyPane />
                ) : (
                  <>
                    {!frameLoaded && <FrameSkeleton />}
                    <iframe
                      ref={frameRef}
                      key={frameSrc}
                      src={frameSrc}
                      title={`${paneLabel} — ${panePath}`}
                      onLoad={onFrameLoad}
                      className="h-full w-full border-0 bg-white"
                    />
                  </>
                )}
              </div>

              {chatActive && <LobbyThread chat={chat} endRef={threadEndRef} />}
            </div>

            <LobbyComposer
              chat={chat}
              onNavigate={go}
              onOpenRoute={openRoute}
              paneLabel={paneLabel}
              panePath={panePath || "/"}
              seedPrompt={intent?.prompt}
              seedNonce={intent?.nonce}
            />
          </main>

          {rightOpen ? (
            <div className="hidden w-72 shrink-0 lg:block xl:w-80">
              <LobbySideRail chat={chat} onMinimise={() => setRightOpen(false)} onOpenRoute={openRoute} />
            </div>
          ) : (
            <RailRestore
              className="hidden lg:flex"
              label="Show the reports rail"
              text="Rail"
              onClick={() => setRightOpen(true)}
            />
          )}
        </div>
      </div>
      <FocusSentinel onFocus={() => focusEdge("first")} />
    </>
  );
}

function RailRestore({
  className,
  label,
  text,
  onClick,
}: {
  className?: string;
  label: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        `${SURFACE} ${FOCUS} w-11 shrink-0 flex-col items-center justify-center gap-2 ` +
        `bg-white/80 text-[11px] font-semibold text-slate-700 transition hover:bg-white ` +
        `motion-reduce:transition-none ${className ?? ""}`
      }
      style={panelStyle}
    >
      <span aria-hidden="true" className="text-[16px] leading-none text-slate-500">+</span>
      <span className="[writing-mode:vertical-rl] rotate-180 tracking-wide">{text}</span>
    </button>
  );
}

function FrameSkeleton() {
  return (
    <div className="absolute inset-0 z-10 space-y-4 bg-white p-8 motion-safe:animate-pulse" aria-hidden="true">
      <div className="h-7 w-1/3 rounded bg-slate-900/10" />
      <div className="h-3.5 w-2/3 rounded bg-slate-900/10" />
      <div className="h-3.5 w-1/2 rounded bg-slate-900/10" />
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="h-28 rounded-xl bg-slate-900/10" />
        <div className="h-28 rounded-xl bg-slate-900/10" />
        <div className="h-28 rounded-xl bg-slate-900/10" />
        <div className="h-28 rounded-xl bg-slate-900/10" />
      </div>
    </div>
  );
}

export { ColiseumGlyph };
