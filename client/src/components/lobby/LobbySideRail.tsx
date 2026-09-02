import { useRef, useState, useEffect } from "react";
import { CONTROL, FOCUS, SP, SURFACE, TYPE, panelStyle } from "./glass";
import LobbyReports from "./LobbyReports";
import LobbyTaskRail from "./LobbyTaskRail";
import LobbyChats from "./LobbyChats";
import LobbyThread from "./LobbyThread";
import type { LobbyChat } from "./useLobbyChat";
import { Terminal, Activity, FileText, Settings, Sparkles } from "lucide-react";

/**
 * LobbySideRail — the RIGHT rail. The live conversation lives here.
 *
 * The thread used to render inside the CENTRE column, stacked under the pane, which
 * collapsed the pane to two fifths of its height the moment you asked a question — so
 * asking about something shrank the thing you were asking about. The centre is the OS;
 * this rail is the AI beside it.
 *
 *   Reports  the signed / public artefacts, with honest live-or-failed states
 *   Tasks    the running checks (the fetches this lobby makes on your behalf)
 *   Chats    this session's threads, in memory, and the rail says so
 *
 * Same ARIA contract as the left rail, horizontal this time: role="tablist"
 * aria-orientation="horizontal", roving tabindex so the switcher is a single Tab
 * stop, ←/→ to move, Home/End to jump. The rail itself is collapsible from the
 * header; when it is hidden nothing here is mounted, so the fetches stop too.
 */

type SectionId = "ask" | "reports" | "tasks" | "chats";

const SECTIONS: { id: SectionId; label: string; hint: string; icon?: any }[] = [
  { id: "ask", label: "Console", icon: Terminal, hint: "The live conversation" },
  { id: "reports", label: "Artifacts", icon: FileText, hint: "Signed and public artefacts" },
  { id: "tasks", label: "Swarm", icon: Activity, hint: "Checks running right now" },
  { id: "chats", label: "Memory", icon: Settings, hint: "Threads in this session" },
];

const domId = (id: SectionId) => `coai-lobby-section-${id}`;
const PANEL = "coai-lobby-section-panel";

export default function LobbySideRail({
  chat,
  threadEndRef,
  onMinimise,
  onOpenRoute,
}: {
  chat: LobbyChat;
  /** Scroll anchor for the live thread, owned by the overlay so it survives section switches. */
  threadEndRef?: React.RefObject<HTMLDivElement>;
  onMinimise?: () => void;
  /** Open a route in the lobby pane instead of navigating away (session survives). */
  onOpenRoute?: (path: string, label: string) => void;
}) {
  const [section, setSection] = useState<SectionId>(chat.turnCount > 0 ? "ask" : "reports");
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-switch to the Agent Console (Ask) when a chat starts or becomes busy
  useEffect(() => {
    if (chat.busy || chat.turnCount > 0) {
      setSection("ask");
    }
  }, [chat.busy, chat.turnCount]);


  const move = (to: number) => {
    const i = ((to % SECTIONS.length) + SECTIONS.length) % SECTIONS.length;
    const next = SECTIONS[i];
    setSection(next.id);
    setTimeout(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`#${domId(next.id)}`)?.focus();
    }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = SECTIONS.findIndex((s) => s.id === section);
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": e.preventDefault(); move(at + 1); break;
      case "ArrowLeft": case "ArrowUp": e.preventDefault(); move(at - 1); break;
      case "Home": e.preventDefault(); move(0); break;
      case "End": e.preventDefault(); move(SECTIONS.length - 1); break;
      default: break;
    }
  };

  const current = SECTIONS.find((s) => s.id === section)!;

  return (
    <aside
      aria-label="Reports, tasks and chats"
      className={`${SURFACE} ${SP.rail} flex h-full w-full flex-col`}
      style={panelStyle}
    >

      <div className="mb-4 flex shrink-0 items-center justify-between gap-2 border-b border-slate-900/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold tracking-tight text-slate-900">Antigravity OS</h2>
            <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">Agent Controller</p>
          </div>
        </div>
        {onMinimise && (
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Hide the agent controller"
            className={`${CONTROL} ${SP.chip} text-[11px] font-semibold bg-white/50 hover:bg-slate-100 border-0`}
          >
            Hide
          </button>
        )}
      </div>

      <div
        ref={listRef}
        role="tablist"
        aria-orientation="horizontal"
        aria-label="Side rail sections"
        onKeyDown={onKeyDown}
        className="mb-5 flex gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 shadow-inner"
      >
        {SECTIONS.map((s) => {
          const on = s.id === section;
          return (
            <button
              key={s.id}
              id={domId(s.id)}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={PANEL}
              tabIndex={on ? 0 : -1}
              title={s.hint}
              onClick={() => setSection(s.id)}
              className={
                `flex-1 flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ` +
                `motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ` +
                (on ? "bg-white text-emerald-800 shadow-[0_2px_8px_-4px_rgba(16,185,129,0.4)] border border-emerald-100" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent")
              }
            >
              {s.icon && <s.icon className={`h-4 w-4 ${on ? "text-emerald-600" : "text-slate-400"}`} />}
              {s.label}
            </button>
          );
        })}
      </div>

      <div
        id={PANEL}
        role="tabpanel"
        aria-labelledby={domId(section)}
        tabIndex={0}
        // `flex flex-col` is load-bearing: LobbyThread's root is `min-h-0 flex-1
        // overflow-y-auto`, and flex-1 does nothing under a non-flex parent — so a
        // long answer grew past the panel and painted over the "move between
        // sections" footer and out through the bottom of the rail. Seen at 375px
        // in the drawer, but the desktop column has the same shape. The Reports /
        // Tasks / Chats sections use `flex h-full flex-col` with their own scroll
        // container and are unaffected either way.
        className={`flex min-h-0 flex-1 flex-col ${FOCUS}`}
      >
        <p className="sr-only">{current.hint}</p>
        {section === "ask" && (
          chat.turnCount > 0
            ? <LobbyThread chat={chat} endRef={threadEndRef} />
            : <p className={`px-4 py-6 ${TYPE.fine}`}>
                Antigravity Agent is standing by. Give me a command using the composer below to control Council OS, navigate the site, or evaluate evidence.
              </p>
        )}
        {section === "reports" && <LobbyReports onOpenRoute={onOpenRoute} />}
        {section === "tasks" && <LobbyTaskRail />}
        {section === "chats" && <LobbyChats chat={chat} />}
      </div>

      <p className={`pt-4 ${TYPE.fine}`}>
        <span className="font-semibold text-slate-600">← →</span> move between sections.
      </p>
    </aside>
  );
}
