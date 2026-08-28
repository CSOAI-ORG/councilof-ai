import { useEffect, useRef, useState } from "react";
import { Bot, MessageSquare, Route, Sparkles, Wrench } from "lucide-react";
import { CONTROL, FOCUS, SP, SURFACE, TYPE, panelStyle } from "./glass";
import LobbyReports from "./LobbyReports";
import LobbyTaskRail from "./LobbyTaskRail";
import LobbyChats from "./LobbyChats";
import LobbyToolingRail from "./LobbyToolingRail";
import type { LobbyChat } from "./useLobbyChat";
import { openLobby, type LobbyTaskId } from "@/lib/lobbyLink";
import type { LobbyTabId } from "./tabs";
import { aguiAvailable } from "./aguiStream";

/**
 * LobbySideRail — AG-UI control rail (right).
 *
 * Default section is **Control**: speak-to-drive chips that seed the centre
 * composer (consent lock — never auto-send). End users talk to Council OS to
 * switch panes, open site surfaces, and call AG-UI measured tools.
 */

type SectionId = "control" | "reports" | "tasks" | "chats" | "tooling";

const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: "control", label: "Control", hint: "Talk to drive Council OS" },
  { id: "reports", label: "Reports", hint: "Signed and public artefacts" },
  { id: "tasks", label: "Tasks", hint: "Checks running right now" },
  { id: "chats", label: "Chats", hint: "Threads in this session" },
  { id: "tooling", label: "Tooling", hint: "Depth surfaces beside the dock" },
];

type DriveChip = {
  id: string;
  label: string;
  blurb: string;
  pane?: LobbyTabId;
  task?: LobbyTaskId;
  prompt?: string;
  aguiHandle?: string;
  path?: string;
};

const DRIVE_CHIPS: DriveChip[] = [
  {
    id: "board",
    label: "Read the board",
    blurb: "Which slots are MEASURED vs empty?",
    pane: "board",
    task: "read-the-board",
  },
  {
    id: "verify",
    label: "Verify a card",
    blurb: "Offline recompute — free forever",
    pane: "verify",
    prompt: "Walk me through verifying a signed GSPC card offline — hash, Ed25519, and what fails closed.",
    path: "/gspc-verify",
  },
  {
    id: "indices",
    label: "Labour indices",
    blurb: "UNMEASURED honesty rail",
    pane: "home",
    prompt:
      "What are the three labour/AI-economy indices, why are they UNMEASURED, and why must they never fuse into GSPC grades?",
    path: "/indices",
  },
  {
    id: "products",
    label: "Products catalog",
    blurb: "Nine rails · grades never sold",
    prompt: "List Council OS products that are MEASURED versus UNMEASURED — confirm grades are never sold.",
    path: "/products",
  },
  {
    id: "mcp",
    label: "MCP fleet",
    blurb: "GET /api/mcp · measured tools",
    pane: "mcp",
    prompt: "List MCP tools I can call from this lobby — gspc_board, indices_catalog, rwa_attestation_catalog — and what stays UNMEASURED.",
    path: "/mcp-fleet",
  },
  {
    id: "arena",
    label: "Open arena",
    blurb: "Council Space · model vs model",
    pane: "arena",
    task: "arena",
    path: "/gspc-arena",
  },
  {
    id: "routes",
    label: "Eunomia routes",
    blurb: "291 MCP governance routes",
    pane: "routes",
    task: "eunomia-router",
  },
  {
    id: "fix",
    label: "MEOK / AG-UI assist",
    blurb: "Remediation wire · measured cards only",
    pane: "fix",
    task: "meok-assist",
    aguiHandle: "remediation-assist",
  },
  {
    id: "sovos",
    label: "SovOS workspace",
    blurb: "Dockable board · games · flywheel",
    prompt: "Open SovOS — what panels are live versus DESIGN, and how do I stay wire-first?",
    path: "/sov-os",
  },
  {
    id: "engine",
    label: "Engine Axis",
    blurb: "Financial slots 18–25",
    task: "engine-axis-brief",
    path: "/engine-axis",
  },
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
  const [section, setSection] = useState<SectionId>("control");
  const [driveText, setDriveText] = useState("");
  const [wireLive, setWireLive] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    aguiAvailable()
      .then((ok) => {
        if (!cancelled) setWireLive(ok);
      })
      .catch(() => {
        if (!cancelled) setWireLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        move(at + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        move(at - 1);
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(SECTIONS.length - 1);
        break;
      default:
        break;
    }
  };

  const drive = (chip: DriveChip) => {
    if (chip.path && onOpenRoute) onOpenRoute(chip.path, chip.label);
    openLobby({
      pane: chip.pane,
      task: chip.task,
      prompt: chip.prompt,
      aguiHandle: chip.aguiHandle,
    });
  };

  const current = SECTIONS.find((s) => s.id === section)!;

  return (
    <aside
      aria-label="AG-UI control rail — talk to drive Council OS"
      className={`${SURFACE} ${SP.rail} flex h-full w-full flex-col`}
      style={panelStyle}
    >
      <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className={`${TYPE.section} flex items-center gap-1.5`}>
            <Bot className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
            AG-UI control
          </h2>
          <p className={`mt-0.5 ${TYPE.fine}`}>Talk to drive panes, site, and measured tools.</p>
        </div>
        {onMinimise && (
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Hide the AG-UI control rail"
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
        className="mb-3 flex flex-wrap gap-1 rounded-xl bg-slate-900/5 p-1"
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
                `flex-1 min-w-[3.75rem] rounded-lg px-1.5 py-1.5 text-[10px] font-semibold transition ` +
                `motion-reduce:transition-none ${FOCUS} ` +
                (on ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900")
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

        {section === "control" && (
          <div className="flex h-full flex-col overflow-y-auto pr-1">
            <div className="mb-3 rounded-xl border border-emerald-700/20 bg-emerald-50/80 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Speak · then Ask
              </p>
              <p className={`mt-1 ${TYPE.fine}`}>
                Type or tap a chip — the centre composer prefills. Nothing sends until you press Ask
                (consent lock). Drive Council OS, site surfaces, and measured tools by talking.
              </p>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wide text-emerald-800/80">
                AG-UI wire ·{" "}
                {wireLive === null ? "probing…" : wireLive ? "live · /api/agui" : "local · grounded / pane cmds"}
              </p>
            </div>

            <form
              className="mb-3 space-y-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                const q = driveText.trim();
                if (!q) return;
                openLobby({
                  prompt: q,
                  aguiHandle: wireLive ? "lobby" : undefined,
                });
                setDriveText("");
              }}
            >
              <label htmlFor="coai-agui-drive" className="sr-only">
                Tell Council OS what to open or control
              </label>
              <textarea
                id="coai-agui-drive"
                rows={2}
                value={driveText}
                onChange={(e) => setDriveText(e.target.value)}
                placeholder="e.g. Open labour indices and explain why they stay UNMEASURED…"
                className={`w-full resize-none rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-[12px] text-slate-900 placeholder:text-slate-400 ${FOCUS}`}
              />
              <button
                type="submit"
                disabled={!driveText.trim()}
                className={`w-full rounded-xl bg-emerald-800 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
              >
                Prefill Ask · consent lock
              </button>
            </form>

            <ul className="space-y-1.5">
              {DRIVE_CHIPS.map((chip) => (
                <li key={chip.id}>
                  <button
                    type="button"
                    onClick={() => drive(chip)}
                    className={`flex w-full items-start gap-2 rounded-xl border border-slate-900/10 bg-white/90 px-3 py-2 text-left hover:border-emerald-600/30 hover:bg-emerald-50/50 ${FOCUS}`}
                  >
                    {chip.id === "mcp" || chip.id === "routes" ? (
                      <Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-800" aria-hidden />
                    ) : chip.id === "fix" ? (
                      <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-800" aria-hidden />
                    ) : (
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-800" aria-hidden />
                    )}
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-slate-900">{chip.label}</span>
                      <span className="block text-[10px] leading-snug text-slate-500">{chip.blurb}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <p className={`mt-auto pt-3 ${TYPE.fine}`}>
              Measurement, not certification. Empty cells stay empty. DSH = same evidence as OS.
            </p>
          </div>
        )}

        {section === "reports" && <LobbyReports />}
        {section === "tasks" && <LobbyTaskRail />}
        {section === "chats" && <LobbyChats chat={chat} />}
        {section === "tooling" && (
          <div className="h-full overflow-y-auto pr-1">
            <LobbyToolingRail onOpenRoute={onOpenRoute} />
          </div>
        )}
      </div>
    </aside>
  );
}
