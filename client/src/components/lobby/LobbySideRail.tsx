import { useRef, useState } from "react";
import { CONTROL, FOCUS, SP, SURFACE, TYPE, panelStyle } from "./glass";
import LobbyReports from "./LobbyReports";
import LobbyTaskRail from "./LobbyTaskRail";
import LobbyChats from "./LobbyChats";
import LobbyThread from "./LobbyThread";
import type { LobbyChat } from "./useLobbyChat";

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

const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: "ask", label: "Ask", hint: "The live conversation" },
  { id: "reports", label: "Reports", hint: "Signed and public artefacts" },
  { id: "tasks", label: "Tasks", hint: "Checks running right now" },
  { id: "chats", label: "Chats", hint: "Threads in this session" },
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
      data-testid="os-side-rail"
      aria-label="Reports, tasks and chats"
      className={`${SURFACE} ${SP.rail} flex h-full w-full flex-col`}
      style={panelStyle}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className={TYPE.section}>Side rail</h2>
        {onMinimise && (
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Hide the reports rail"
            className={`${CONTROL} ${SP.chip} text-[11px] font-semibold`}
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
        className="mb-4 flex gap-1 rounded-xl bg-slate-900/5 p-1"
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
                `flex-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ` +
                `motion-reduce:transition-none ${FOCUS} ` +
                (on ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")
              }
            >
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
                Nothing asked yet in this session. Use the composer below the pane and the
                conversation appears here, beside what you are asking about.
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
