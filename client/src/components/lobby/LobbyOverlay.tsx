import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_TAB, LOBBY_TABS, tabById, type LobbyTab, type LobbyTabId } from "./tabs";
import LobbyTaskRail from "./LobbyTaskRail";
import LobbyChatBar from "./LobbyChatBar";
import type { LobbyIntent } from "@/lib/lobbyLink";

/**
 * LobbyOverlay — the full-screen glass surface of the Council Lobby.
 *
 * Three rails and a bar:
 *   left    tab list, one entry per live surface
 *   centre  that surface, framed live from its own route (never re-implemented)
 *   right   collapsible task rail: real fetches, honest states
 *   foot    the persistent chat bar
 *
 * TRANSPARENCY. One number, `alpha` (0.30 – 1.00), drives every panel background
 * through the CSS custom property `--lobby-alpha` set on the overlay root. The
 * slider in the top bar writes it; localStorage remembers it. Nothing else in the
 * component hardcodes a panel background, so the whole surface stays consistent
 * at any setting.
 *
 * DEEP LINKS. An optional `intent` (from useLobbyDeepLink, see
 * client/src/lib/lobbyLink.ts) selects the pane on arrival and hands its seeded
 * prompt to the chat bar. The bar types it and stops — the send is always the
 * user's, so a link may choose the question but never asks it.
 */

const ALPHA_KEY = "coai.lobby.alpha";
const TAB_KEY = "coai.lobby.tab";
const ALPHA_MIN = 0.3;
const ALPHA_MAX = 1;

function readAlpha(): number {
  try {
    const v = Number(localStorage.getItem(ALPHA_KEY));
    if (Number.isFinite(v) && v >= ALPHA_MIN && v <= ALPHA_MAX) return v;
  } catch { /* private mode / storage disabled — the default is fine */ }
  return 0.82;
}

function readTab(): LobbyTabId {
  try {
    const v = localStorage.getItem(TAB_KEY);
    if (v && LOBBY_TABS.some((t) => t.id === v)) return v as LobbyTabId;
  } catch { /* ignore */ }
  return DEFAULT_TAB;
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
  const [railOpen, setRailOpen] = useState(true);
  const [frameLoaded, setFrameLoaded] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const tab = tabById(tabId);

  useEffect(() => { try { localStorage.setItem(ALPHA_KEY, String(alpha)); } catch { /* ignore */ } }, [alpha]);
  useEffect(() => { try { localStorage.setItem(TAB_KEY, tabId); } catch { /* ignore */ } }, [tabId]);

  // Esc closes. The trigger re-focuses itself on unmount (see CouncilLobby).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The page behind must not scroll while the lobby is over it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => { rootRef.current?.focus(); }, []);

  // A later intent (an in-page CTA fired while the lobby is already open) moves
  // the pane. `nonce` makes a repeat of the same request land again.
  useEffect(() => {
    if (!intent) return;
    setTabId((cur) => { if (cur !== intent.pane) setFrameLoaded(false); return intent.pane; });
  }, [intent?.nonce, intent?.pane]);

  const go = useCallback((t: LobbyTab) => {
    setTabId((cur) => { if (cur !== t.id) setFrameLoaded(false); return t.id; });
  }, []);

  /** Every panel in the lobby reads its ground from this one variable. */
  const panel = useMemo<React.CSSProperties>(
    () => ({ background: "rgba(4, 34, 26, var(--lobby-alpha))" }),
    [],
  );

  // `?embed=1` is a hint for the framed page, not a contract it honours yet.
  const src = tab.path + (tab.path.includes("?") ? "&" : "?") + "embed=1";

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Council Lobby"
      className="fixed inset-0 z-[80] flex flex-col gap-2 p-2 outline-none backdrop-blur-xl sm:gap-3 sm:p-3"
      style={{
        // The slider drives this; every panel inherits it.
        ["--lobby-alpha" as any]: String(alpha),
        background: `rgba(2, 20, 15, ${(0.35 + alpha * 0.5).toFixed(3)})`,
      }}
    >
      {/* ── top bar ─────────────────────────────────────────────────────── */}
      <header
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-emerald-300/20 px-3 py-2"
        style={panel}
      >
        <ColiseumGlyph className="h-6 w-6 shrink-0 text-emerald-300" />
        <div className="min-w-0">
          <div className="text-[13px] font-bold leading-tight text-emerald-50">Council Lobby</div>
          <div className="truncate text-[10px] leading-tight text-emerald-100/55">
            Measurement, not certification — every pane is the live page, framed.
          </div>
        </div>

        <label className="ml-auto flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-emerald-100/70">
          <span className="hidden sm:inline">Transparency</span>
          <input
            type="range"
            min={ALPHA_MIN}
            max={ALPHA_MAX}
            step={0.02}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            aria-label="Panel transparency"
            className="h-1 w-24 cursor-pointer accent-emerald-400 sm:w-36"
          />
          <span className="w-9 font-mono tabular-nums text-emerald-200/70">{alpha.toFixed(2)}</span>
        </label>

        <button
          onClick={() => setRailOpen((v) => !v)}
          aria-expanded={railOpen}
          className="rounded-full border border-emerald-300/25 px-2.5 py-1 text-[10px] font-semibold text-emerald-100/80 transition hover:bg-white/10"
        >
          {railOpen ? "Hide tasks" : "Show tasks"}
        </button>

        <button
          onClick={onClose}
          aria-label="Close the Council Lobby"
          className="rounded-full border border-emerald-300/25 px-2.5 py-1 text-[12px] font-bold leading-none text-emerald-100/80 transition hover:bg-white/10"
        >
          ✕
        </button>
      </header>

      {/* ── three rails ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-2 sm:gap-3">
        {/* left */}
        <nav
          aria-label="Council Lobby sections"
          className="hidden w-40 shrink-0 flex-col rounded-2xl border border-emerald-300/20 p-2 sm:flex lg:w-48"
          style={panel}
        >
          <div role="tablist" aria-orientation="vertical" className="space-y-1">
            {LOBBY_TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={t.id === tabId}
                onClick={() => go(t)}
                className={
                  "w-full rounded-xl px-3 py-2 text-left text-[12.5px] font-semibold transition " +
                  (t.id === tabId
                    ? "bg-emerald-400/20 text-emerald-50 ring-1 ring-emerald-300/40"
                    : "text-emerald-100/70 hover:bg-white/10 hover:text-emerald-50")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-auto pt-3 text-[10px] leading-relaxed text-emerald-100/40">
            Each pane frames the real route. Nothing here is a copy of a page, so nothing here can
            drift from one.
          </p>
        </nav>

        {/* centre */}
        <main className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-emerald-300/20" style={panel}>
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5">
            <span className="text-[11px] font-bold text-emerald-50">{tab.label}</span>
            <span className="hidden truncate text-[10px] text-emerald-100/50 md:inline">{tab.blurb}</span>
            <a
              href={tab.path}
              className="ml-auto shrink-0 font-mono text-[10px] text-emerald-200/60 underline-offset-2 hover:text-emerald-100 hover:underline"
            >
              {tab.path} ↗
            </a>
          </div>

          {/* mobile tab strip — the left rail is hidden under sm */}
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 py-1.5 sm:hidden">
            {LOBBY_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t)}
                aria-current={t.id === tabId}
                className={
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                  (t.id === tabId ? "bg-emerald-400/25 text-emerald-50" : "text-emerald-100/65")
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative h-[calc(100%-2.25rem)] sm:h-[calc(100%-2.25rem)]">
            {!frameLoaded && <FrameSkeleton />}
            <iframe
              key={tab.id}
              src={src}
              title={`${tab.label} — ${tab.path}`}
              onLoad={() => setFrameLoaded(true)}
              className="h-full w-full border-0 bg-white/95"
            />
          </div>
        </main>

        {/* right */}
        {railOpen && (
          <aside className="hidden w-56 shrink-0 lg:block">
            <LobbyTaskRail panel={panel} />
          </aside>
        )}
      </div>

      {/* ── chat bar ────────────────────────────────────────────────────── */}
      <LobbyChatBar
        panel={panel}
        onNavigate={go}
        seedPrompt={intent?.prompt}
        seedNonce={intent?.nonce}
      />
    </div>
  );
}

function FrameSkeleton() {
  return (
    <div className="absolute inset-0 z-10 animate-pulse space-y-3 bg-emerald-950/40 p-6" aria-hidden="true">
      <div className="h-6 w-1/3 rounded bg-white/10" />
      <div className="h-3 w-2/3 rounded bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-white/10" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-24 rounded-xl bg-white/10" />
        <div className="h-24 rounded-xl bg-white/10" />
        <div className="h-24 rounded-xl bg-white/10" />
        <div className="h-24 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

/** Columns under an arch — the lobby's mark. */
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
