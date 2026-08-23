import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DEFAULT_TAB, LOBBY_TABS, tabById, type LobbyTab, type LobbyTabId } from "./tabs";
import LobbyHeader, { ColiseumGlyph } from "./LobbyHeader";
import LobbyPaneRail, { PANEL_ID, tabDomId } from "./LobbyPaneRail";
import LobbySideRail from "./LobbySideRail";
import LobbyComposer from "./LobbyComposer";
import LobbyThread from "./LobbyThread";
import LobbyWorkspace, { hubViewForTab } from "./LobbyWorkspace";
import { useLobbyChat } from "./useLobbyChat";
import { ALPHA_DEFAULT, ALPHA_MAX, ALPHA_MIN, FOCUS, SP, SURFACE_LIFTED, TYPE } from "./glass";
import type { LobbyIntent } from "@/lib/lobbyLink";
import { tabForPath } from "@/lib/embed";
import { setOsOpen } from "@/lib/osChrome";
import { isWorkspaceTab } from "./lobbyNav";
import {
  LEFT_DEFAULT, LEFT_KEY, RIGHT_DEFAULT, RIGHT_KEY, readOpen, writeOpen,
} from "./rails";

/**
 * Council OS — OpenRouter-style living workspace.
 *
 *   header   Council OS bar (site header while open)
 *   left     Grouped sidebar — measurement, tooling, surfaces
 *   centre   Board / models / routes / MCP / chat — never a web page iframe
 *   right    Reports · tasks · chats
 *
 * Surfaces with a path navigate the real site column (footer stays visible).
 */

const ALPHA_KEY = "coai.lobby.alpha";
const TAB_KEY = "coai.lobby.tab";
const TITLE_ID = "coai-lobby-title";

function readAlpha(): number {
  try {
    const v = Number(localStorage.getItem(ALPHA_KEY));
    if (Number.isFinite(v) && v >= ALPHA_MIN && v <= ALPHA_MAX) return v;
  } catch { /* ignore */ }
  return ALPHA_DEFAULT;
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
  const [tabId, setTabId] = useState<LobbyTabId>(() => intent?.pane ?? readTab());
  const [leftOpen, setLeftOpen] = useState(() => readOpen(LEFT_KEY, LEFT_DEFAULT));
  const [rightOpen, setRightOpen] = useState(() => readOpen(RIGHT_KEY, RIGHT_DEFAULT));
  const [minimised, setMinimised] = useState(false);
  const [location, setLocation] = useLocation();

  const threadEndRef = useRef<HTMLDivElement>(null);
  const chat = useLobbyChat();
  const tab = tabById(tabId);

  useEffect(() => { try { localStorage.setItem(ALPHA_KEY, String(alpha)); } catch { /* ignore */ } }, [alpha]);
  useEffect(() => { try { localStorage.setItem(TAB_KEY, tabId); } catch { /* ignore */ } }, [tabId]);
  useEffect(() => { writeOpen(LEFT_KEY, leftOpen); }, [leftOpen]);
  useEffect(() => { writeOpen(RIGHT_KEY, rightOpen); }, [rightOpen]);

  useEffect(() => {
    setOsOpen(!minimised);
    return () => setOsOpen(false);
  }, [minimised]);

  const minimise = useCallback(() => setMinimised(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "." && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setMinimised((m) => !m);
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "[") { e.preventDefault(); setLeftOpen((v) => !v); return; }
      if (e.key === "]") { e.preventDefault(); setRightOpen((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Sync sidebar highlight when the reader navigates the site column.
  useEffect(() => {
    const matched = tabForPath(location);
    if (matched && matched.id !== tabId) setTabId(matched.id);
  }, [location, tabId]);

  useEffect(() => {
    if (!intent) return;
    setMinimised(false);
    const next = tabById(intent.pane);
    setTabId(intent.pane);
    if (next.kind === "route" && next.path) setLocation(next.path);
  }, [intent?.nonce, intent?.pane, setLocation]);

  const go = useCallback(
    (t: LobbyTab) => {
      setTabId(t.id);
      if (t.kind === "route" && t.path) setLocation(t.path);
    },
    [setLocation],
  );

  const openRoute = useCallback(
    (path: string, _label: string) => {
      setLocation(path);
      const matched = tabForPath(path);
      if (matched) setTabId(matched.id);
    },
    [setLocation],
  );

  const paneLabel = tab.label;
  const panePath = tab.kind === "route" ? location : tab.path;
  const chatActive = chat.turnCount > 0;
  const showWorkspace = isWorkspaceTab(tabId);

  useEffect(() => {
    if (!chatActive) return;
    requestAnimationFrame(() => threadEndRef.current?.scrollIntoView({ block: "end" }));
  }, [chat.turnCount, chatActive]);

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
          <span className="block text-[13px] font-semibold leading-tight text-slate-900">Council OS — minimised</span>
          <span className={`block ${TYPE.fine}`}>
            {paneLabel} · {chat.turnCount} message{chat.turnCount === 1 ? "" : "s"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setMinimised(false)}
          className={`ml-auto shrink-0 rounded-xl bg-emerald-700 px-3.5 py-2 text-[12px] font-semibold text-white ${FOCUS}`}
        >
          Restore
        </button>
        <button type="button" onClick={onClose} className={`shrink-0 rounded-xl border px-3 py-2 text-[12px] font-semibold ${FOCUS}`}>
          Close
        </button>
      </div>
    );
  }

  return (
    <>
      <LobbyHeader
        titleId={TITLE_ID}
        alpha={alpha}
        onAlpha={setAlpha}
        size="full"
        onToggleSize={() => {}}
        onMinimise={minimise}
        onClose={onClose}
        leftOpen={leftOpen}
        onToggleLeft={() => setLeftOpen((v) => !v)}
        rightOpen={rightOpen}
        onToggleRight={() => setRightOpen((v) => !v)}
      />

      <div
        data-coai="Council Lobby"
        className="coai-os-dock fixed bottom-0 right-0 z-[75] flex border-l border-t border-slate-900/10 bg-white/95 shadow-2xl backdrop-blur-xl"
        style={{ top: "var(--coai-os-header-height, 4.5rem)", width: rightOpen ? "min(100%, 52rem)" : "min(100%, 36rem)" }}
      >
        {leftOpen && (
          <div className="hidden w-52 shrink-0 border-r border-slate-900/10 sm:block lg:w-56">
            <LobbyPaneRail tabId={tabId} onSelect={go} onMinimise={() => setLeftOpen(false)} />
          </div>
        )}

        <main
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={tabDomId(tabId)}
          className="flex min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-x-3 border-b border-slate-900/10 px-4 py-2">
            <span className="text-[12.5px] font-semibold text-slate-900">{paneLabel}</span>
            <span className={`hidden truncate md:inline ${TYPE.fine}`}>{tab.blurb}</span>
            {panePath && (
              <span className="ml-auto font-mono text-[10px] text-slate-500">
                {showWorkspace ? "workspace" : `site ${panePath}`}
              </span>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className={`relative min-h-0 overflow-y-auto ${chatActive ? "max-h-[45%]" : "flex-1"}`}>
              {showWorkspace ? (
                <LobbyWorkspace
                  tab={tab}
                  hubView={hubViewForTab(tabId)}
                  onSelect={go}
                  onOpenRoute={openRoute}
                />
              ) : (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm font-semibold text-slate-900">Reading in the site column</p>
                  <p className={`mt-2 max-w-xs ${TYPE.muted}`}>
                    {location} is open in the page beside this dock. Scroll the site — footer stays visible. Ask below for AG-UI or grounded chat.
                  </p>
                </div>
              )}
            </div>
            {chatActive && <LobbyThread chat={chat} endRef={threadEndRef} />}
          </div>

          <LobbyComposer
            chat={chat}
            onNavigate={go}
            paneLabel={paneLabel}
            panePath={panePath || location || "/"}
            seedPrompt={intent?.prompt}
            seedNonce={intent?.nonce}
            aguiHandle={intent?.aguiHandle}
          />
        </main>

        {rightOpen && (
          <div className="hidden w-64 shrink-0 border-l border-slate-900/10 lg:block xl:w-72">
            <LobbySideRail chat={chat} onMinimise={() => setRightOpen(false)} />
          </div>
        )}
      </div>
    </>
  );
}

export { ColiseumGlyph };
