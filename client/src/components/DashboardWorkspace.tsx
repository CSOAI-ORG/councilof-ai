import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { History } from "lucide-react";
import { createPortal } from "react-dom";
import { Link, useLocation, useSearch } from "wouter";
import DashboardRightRail from "@/components/DashboardRightRail";
import CandidateEvidenceTray from "@/components/CandidateEvidenceTray";
import LobbyComposer, {
  type ComposerTool,
} from "@/components/lobby/LobbyComposer";
import LobbyThread from "@/components/lobby/LobbyThread";
import TalkPanel, { type TalkPanelHandle } from "@/components/talk/TalkPanel";
import GspcWorkspaceHome from "@/components/gspc/GspcWorkspaceHome";
import {
  isExplicitNavigationCommand,
  LOBBY_TABS,
  matchRoute,
  matchTab,
  type LobbyTab,
} from "@/components/lobby/tabs";
import { useLobbyChat } from "@/components/lobby/useLobbyChat";
import { recordActivity, useActivity } from "@/components/lobby/workspace";
import { dashboardViewHref } from "@/lib/dashboardView";
import { listTools } from "@/lib/sovTools";
import {
  CANDIDATE_MESSAGE_TYPE,
  CANDIDATE_PENDING_KEY,
  normalizeCandidateObservation,
  type CandidateObservation,
} from "@/lib/candidateEvidence";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ToolPhase = "loading" | "ready" | "failed";

export function paneForTool(name: string): string {
  return "tools";
}

/**
 * The home composer's question goes to the AG-UI TalkPanel, which answers it on the start screen.
 *
 * 6 Oct 2026: askTalk used to record the question as a lobby chat turn first. That flipped
 * hasConversation, which swapped the home canvas (and the TalkPanel in it) for LobbyThread, and
 * TalkPanel's unmount effect aborted the POST /api/agui/run it had just started: the first question
 * typed on the start screen never got an answer. Two fixes met here and both are kept:
 * - #2834 (master): the question is still recorded in session history (`keepInChat`), but
 *   DashboardWorkspace sets talkOwnsHome before it does, so the turn never swaps the canvas.
 * - tools audit: the question is also kept in the workspace History as an "ask" activity entry.
 *
 * Returns true when the TalkPanel took the question; false sends it on to the lobby chat.
 */
export function askOnHome(
  text: string,
  ctx: {
    activePane: boolean;
    hasConversation: boolean;
    talk: { ask: (question: string) => void } | null;
    record?: typeof recordActivity;
    /** Records the question in session history; runs before the TalkPanel is asked. */
    keepInChat?: (question: string) => void;
  },
): boolean {
  if (ctx.activePane || ctx.hasConversation || !ctx.talk) return false;
  if (isExplicitNavigationCommand(text) && (matchTab(text) || matchRoute(text))) return false;
  const question = text.trim();
  if (!question) return false;
  (ctx.record ?? recordActivity)({ kind: "ask", label: question });
  ctx.keepInChat?.(question);
  ctx.talk.ask(question);
  return true;
}

function shortDescription(description: string): string {
  const sentence = description.split(/(?<=[.!?])\s/)[0]?.trim();
  if (!sentence) return "Published MCP capability.";
  return sentence.length > 150
    ? `${sentence.slice(0, 147).trimEnd()}…`
    : sentence;
}

/** DashboardLayout's section bar exposes this slot for workspace-level actions. */
export const SECTION_ACTIONS_ID = "coai-section-actions";

/**
 * Tools audit, 6 Oct 2026: the candidate-evidence tray offered a receipt that went nowhere,
 * because network intake is not live in this release (CandidateEvidenceTray says so itself).
 * It is not drawn until intake exists; the quest bridge script still posts observations, and the
 * tray returns by flipping this one constant once an intake endpoint is published.
 */
export const CANDIDATE_INTAKE_LIVE = false;

export default function DashboardWorkspace({
  activePane,
  activeTab,
  activeLabel,
  children,
}: {
  activePane: React.ReactNode | null;
  activeTab: string;
  activeLabel: string | null;
  children: React.ReactNode;
}) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const chat = useLobbyChat();
  const threadEndRef = useRef<HTMLDivElement>(null);
  const [tools, setTools] = useState<ComposerTool[]>([]);
  const [toolPhase, setToolPhase] = useState<ToolPhase>("loading");
  const [candidate, setCandidate] = useState<CandidateObservation | null>(null);
  const intentParams = useMemo(
    () =>
      new URLSearchParams(search.startsWith("?") ? search.slice(1) : search),
    [search],
  );
  const seedPrompt = intentParams.get("ask")?.trim() || undefined;

  useEffect(() => {
    let cancelled = false;
    listTools().then((reply) => {
      if (cancelled) return;
      if (reply.state !== "ok") {
        setTools([]);
        setToolPhase("failed");
        return;
      }
      setTools(
        reply.tools.map((tool) => ({
          name: tool.name,
          description: shortDescription(tool.description),
        })),
      );
      setToolPhase("ready");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CANDIDATE_PENDING_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { observation?: unknown };
        const observation = normalizeCandidateObservation(
          parsed?.observation ?? parsed,
        );
        if (observation) setCandidate(observation);
        localStorage.removeItem(CANDIDATE_PENDING_KEY);
      }
    } catch {
      localStorage.removeItem(CANDIDATE_PENDING_KEY);
    }

    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (
        !event.data ||
        typeof event.data !== "object" ||
        event.data.type !== CANDIDATE_MESSAGE_TYPE
      )
        return;
      const observation = normalizeCandidateObservation(
        (event.data as { observation?: unknown }).observation,
      );
      if (observation) setCandidate(observation);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [chat.turnCount]);

  const navigate = useCallback(
    (tab: LobbyTab) => {
      recordActivity({ kind: "pane", label: tab.label, tabId: tab.id });
      setLocation(`/dashboard?tab=${tab.id}`);
    },
    [setLocation],
  );

  const openRoute = useCallback(
    (path: string, label: string) => {
      const tab = LOBBY_TABS.find((candidate) => candidate.path === path);
      if (tab) {
        navigate(tab);
        return;
      }
      recordActivity({ kind: "route", label, path });
      // A Council OS pane (/dashboard?tab=…) opens as itself. dashboardViewHref refuses to frame
      // /dashboard and falls back to Everything A–Z, which is where "show the system card" and
      // "show the regulation feed" used to land (tools audit, 6 Oct 2026).
      setLocation(path.startsWith("/dashboard?") ? path : dashboardViewHref(path, label));
    },
    [navigate, setLocation],
  );

  const selectTool = useCallback(
    (tool: ComposerTool) => {
      recordActivity({ kind: "pane", label: tool.name, tabId: "tools" });
      setLocation(`/dashboard?tab=tools&tool=${encodeURIComponent(tool.name)}`);
    },
    [setLocation],
  );

  // A question asked on the Get results home is answered by the home TalkPanel. It is still
  // recorded in session history (so History/Chats can reach it), but it must not swap the home
  // canvas for LobbyThread: that unmounted the TalkPanel and aborted its /api/agui/run ~8 ms
  // after sending (6 Oct 2026, the first question never got an answer).
  const [talkOwnsHome, setTalkOwnsHome] = useState(false);
  const hasConversation = Boolean(chat.active?.turns.length) && !talkOwnsHome;
  const talkRef = useRef<TalkPanelHandle>(null);
  // On the home surface a typed question goes to the AG-UI TalkPanel (tool cards + citations).
  // An explicit pane command ("show the board") still navigates through the lobby chat.
  // The question is kept in History twice (see askOnHome): as an "ask" activity entry, and as a
  // session-history turn that talkOwnsHome keeps from swapping the canvas and aborting the run.
  const askTalk = useCallback(
    (text: string) =>
      askOnHome(text, {
        activePane: Boolean(activePane),
        hasConversation,
        talk: talkRef.current,
        // #2834: the question is also a turn in session history (Chats › History). talkOwnsHome is
        // set first, in the same batch, so that turn never flips hasConversation and the home
        // canvas (and the TalkPanel's run) stays mounted.
        keepInChat: (question) => {
          setTalkOwnsHome(true);
          chat.recordUserMessage(question);
        },
      }),
    [activePane, hasConversation, chat],
  );
  const activity = useActivity();
  // The side rail only exists when it has something to hold: a conversation that
  // continues beside a tool pane. An empty "Open a pane or start a task" column cost
  // ~320px on every visit and said nothing.
  const railHasContent = Boolean(activePane) && chat.turnCount > 0;
  const [historyOpen, setHistoryOpen] = useState(false);
  const seenTurns = useRef(chat.turnCount);
  useEffect(() => {
    const hasNewTurn = chat.turnCount > seenTurns.current;
    seenTurns.current = chat.turnCount;
    if (!hasNewTurn || !activePane || !window.matchMedia("(max-width: 1279px)").matches) return;

    const turns = chat.active?.turns ?? [];
    const latest = turns[turns.length - 1];
    const question = [...turns].reverse().find((turn) => turn.role === "user")?.text ?? "";
    // Pane-navigation commands should leave the newly opened pane in view.
    if (latest?.role !== "council" || (isExplicitNavigationCommand(question) && (matchTab(question) || matchRoute(question)))) return;
    // The desktop rail shows this answer already; on smaller screens its only
    // home is the closed History drawer. Open that drawer when the answer lands.
    setHistoryOpen(true);
  }, [activePane, chat.active, chat.turnCount]);
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setActionsSlot(document.getElementById(SECTION_ACTIONS_ID));
  }, []);
  const historyAvailable =
    chat.threads.length > 0 || activity.length > 0 || chat.turnCount > 0;

  return (
    <div
      className="relative flex h-full min-h-0 bg-[var(--surface-canvas,#fafaf7)]"
      data-testid="dashboard-workspace"
    >
      <section
        className="flex min-w-0 flex-1 flex-col"
        aria-label="Council workspace canvas"
      >
        {historyAvailable
          ? (() => {
              const trigger = (
                <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className={
                        "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" +
                        (railHasContent ? " xl:hidden" : "") +
                        (actionsSlot ? "" : " absolute right-3 top-3 z-20")
                      }
                      aria-label="Open workspaces, tasks and chat history"
                    >
                      <History className="h-4 w-4" aria-hidden="true" /> History
                    </button>
                  </DialogTrigger>
                  <DialogContent className="!bottom-0 !left-auto !right-0 !top-0 h-dvh w-[min(22rem,92vw)] max-w-none !translate-x-0 !translate-y-0 gap-0 rounded-none p-0">
                    <DialogTitle className="sr-only">
                      Workspace, tasks and chat history
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Review the current workspace, task activity and local chat threads.
                    </DialogDescription>
                    <DashboardRightRail chat={chat} className="w-full border-l-0" />
                  </DialogContent>
                </Dialog>
              );
              // In the full shell the button sits in the section bar, never over pane content.
              return actionsSlot ? createPortal(trigger, actionsSlot) : trigger;
            })()
          : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {activePane ? (
            <div
              className="min-h-0 flex-1 overflow-y-auto bg-background"
              data-testid="dashboard-tool-canvas"
            >
              {activePane}
            </div>
          ) : hasConversation ? (
            <LobbyThread chat={chat} endRef={threadEndRef} />
          ) : (
            <GspcWorkspaceHome
              onAsk={(q) => talkRef.current?.ask(q)}
              toolCount={toolPhase === "ready" ? tools.length : null}
              toolState={toolPhase}
              talk={({ onRunDone }) => (
                <TalkPanel
                  ref={talkRef}
                  variant="dock"
                  onRunDone={onRunDone}
                  className="mt-4 rounded-3xl border border-emerald-950/10 bg-card p-4 shadow-[0_1px_2px_rgba(6,21,15,0.04)] sm:p-5"
                />
              )}
            />
          )}
        </div>
        {CANDIDATE_INTAKE_LIVE && candidate ? (
          <CandidateEvidenceTray
            observation={candidate}
            onDismiss={() => setCandidate(null)}
          />
        ) : null}
        <LobbyComposer
          chat={chat}
          onNavigate={navigate}
          onOpenRoute={openRoute}
          paneLabel={activeLabel || "Conversation"}
          panePath={activePane ? `/dashboard?tab=${activeTab}` : "/dashboard"}
          tools={tools}
          onTool={selectTool}
          seedPrompt={seedPrompt}
          seedNonce={search.length}
          onAsk={askTalk}
        />
      </section>
      {railHasContent ? (
        <div className="hidden min-h-0 xl:block">
          <DashboardRightRail chat={chat} />
        </div>
      ) : null}
    </div>
  );
}
