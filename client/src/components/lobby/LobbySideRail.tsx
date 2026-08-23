import { useRef, useState } from "react";
import { CONTROL, FOCUS, SP, SURFACE, TYPE, panelStyle } from "./glass";
import LobbyReports from "./LobbyReports";
import LobbyTaskRail from "./LobbyTaskRail";
import LobbyChats from "./LobbyChats";
import LobbyToolingRail from "./LobbyToolingRail";
import type { LobbyChat } from "./useLobbyChat";

/**
 * LobbySideRail — the RIGHT rail, with four switchable sections.
 *
 *   Reports  the signed / public artefacts, with honest live-or-failed states
 *   Tasks    the running checks (the fetches this lobby makes on your behalf)
 *   Chats    this session's threads, in memory, and the rail says so
 *   Tooling  quick links to depth surfaces (batch assess, engine axis, firewall, …)
 */

type SectionId = "reports" | "tasks" | "chats" | "tooling";

const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: "reports", label: "Reports", hint: "Signed and public artefacts" },
  { id: "tasks", label: "Tasks", hint: "Checks running right now" },
  { id: "chats", label: "Chats", hint: "Threads in this session" },
  { id: "tooling", label: "Tooling", hint: "Depth surfaces beside the dock" },
];

const domId = (id: SectionId) => `coai-lobby-section-${id}`;
const PANEL = "coai-lobby-section-panel";

export default function LobbySideRail({
  chat,
  onOpenRoute,
  onMinimise,
}: {
  chat: LobbyChat;
  onOpenRoute?: (path: string, label: string) => void;
  onMinimise?: () => void;
}) {
  const [section, setSection] = useState<SectionId>("reports");
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
      aria-label="Reports, tasks, chats and tooling"
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
        className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-900/5 p-1"
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
                `flex-1 min-w-[4.5rem] rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ` +
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
        className={`min-h-0 flex-1 overflow-hidden ${FOCUS}`}
      >
        <p className="sr-only">{current.hint}</p>
        {section === "reports" && <LobbyReports />}
        {section === "tasks" && <LobbyTaskRail />}
        {section === "chats" && <LobbyChats chat={chat} />}
        {section === "tooling" && (
          <div className="h-full overflow-y-auto pr-1">
            <LobbyToolingRail onOpenRoute={onOpenRoute} />
          </div>
        )}
      </div>

      <p className={`shrink-0 pt-4 ${TYPE.fine}`}>
        <span className="font-semibold text-slate-600">← →</span> move between sections.
      </p>
    </aside>
  );
}
