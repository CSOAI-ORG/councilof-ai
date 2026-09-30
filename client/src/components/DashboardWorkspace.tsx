import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Gauge,
  History,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Link, useLocation, useSearch } from "wouter";
import DashboardRightRail from "@/components/DashboardRightRail";
import CandidateEvidenceTray from "@/components/CandidateEvidenceTray";
import LobbyComposer, {
  type ComposerTool,
} from "@/components/lobby/LobbyComposer";
import LobbyThread from "@/components/lobby/LobbyThread";
import TalkPanel, { type TalkPanelHandle } from "@/components/talk/TalkPanel";
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

function shortDescription(description: string): string {
  const sentence = description.split(/(?<=[.!?])\s/)[0]?.trim();
  if (!sentence) return "Published MCP capability.";
  return sentence.length > 150
    ? `${sentence.slice(0, 147).trimEnd()}…`
    : sentence;
}

/** DashboardLayout's section bar exposes this slot for workspace-level actions. */
export const SECTION_ACTIONS_ID = "coai-section-actions";

/** Four plain starting points. Each opens a real pane; none sends anything. */
const STARTERS = [
  {
    href: "/dashboard?tab=board",
    icon: Gauge,
    title: "See the scores",
    body: "How each measured AI model did on every published test.",
  },
  {
    href: "/dashboard?tab=verify",
    icon: ShieldCheck,
    title: "Check a signed record",
    body: "Recompute its fingerprint and signature in your own browser. Free.",
  },
  {
    href: "/dashboard?tab=space",
    icon: Swords,
    title: "Replay a model arena",
    body: "Recorded rounds between models, graded by fixed rules.",
  },
  {
    href: "/dashboard?tab=learn",
    icon: BookOpenCheck,
    title: "Learn how the tests work",
    body: "Walk through a test step by step, then try it yourself.",
  },
] as const;

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
      setLocation(dashboardViewHref(path, label));
    },
    [navigate],
  );

  const selectTool = useCallback(
    (tool: ComposerTool) => {
      recordActivity({ kind: "pane", label: tool.name, tabId: "tools" });
      setLocation(`/dashboard?tab=tools&tool=${encodeURIComponent(tool.name)}`);
    },
    [setLocation],
  );

  const hasConversation = Boolean(chat.active?.turns.length);
  const talkRef = useRef<TalkPanelHandle>(null);
  // On the home surface a typed question goes to the AG-UI TalkPanel (tool cards + citations).
  // An explicit pane command ("show the board") still navigates through the lobby chat.
  const askTalk = useCallback(
    (text: string) => {
      if (activePane || hasConversation || !talkRef.current) return false;
      if (isExplicitNavigationCommand(text) && (matchTab(text) || matchRoute(text))) return false;
      talkRef.current.ask(text);
      return true;
    },
    [activePane, hasConversation],
  );
  const activity = useActivity();
  // The side rail only exists when it has something to hold: a conversation that
  // continues beside a tool pane. An empty "Open a pane or start a task" column cost
  // ~320px on every visit and said nothing.
  const railHasContent = Boolean(activePane) && chat.turnCount > 0;
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
                <Dialog>
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
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
              <div className="mx-auto w-full min-w-0 max-w-3xl">
                <div className="text-center">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Ask the Council
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-700">
                    Ask in plain words. Each answer shows the tool it came from, the
                    record it cites and the state that tool returned &mdash; if there
                    is no evidence, the answer says so.
                  </p>
                </div>

                <TalkPanel
                  ref={talkRef}
                  variant="dock"
                  className="mt-6 rounded-2xl border border-emerald-950/10 bg-card p-4 shadow-[0_1px_2px_rgba(6,21,15,0.04)] sm:p-5"
                />

                <h2 className="mt-10 text-sm font-semibold text-slate-800">Or open a workspace</h2>

                <ul className="mt-3 grid gap-3 text-left sm:grid-cols-2">
                  {STARTERS.map(({ href, icon: Icon, title, body }) => (
                    <li key={title}>
                      <Link
                        href={href}
                        className="group flex h-full items-start gap-3 rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-[0_1px_2px_rgba(6,21,15,0.04)] transition hover:border-emerald-700/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                      >
                        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-sm font-semibold text-slate-950">
                            {title}
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700 motion-reduce:transition-none" aria-hidden="true" />
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                            {body}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-center text-sm text-slate-600">
                  Connect your own AI tool instead?{" "}
                  <Link
                    href="/dashboard?tab=tools"
                    title="Tools declared by tools/list. A tool is runtime-observed only after its own tools/call completes."
                    className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
                  >
                    {toolPhase === "ready"
                      ? `See the ${tools.length} MCP tools`
                      : "See the MCP tools"}
                  </Link>
                </p>

                <details className="mt-10 rounded-xl border border-border bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-800">
                    Account overview and recent measurements
                  </summary>
                  <div className="border-t border-border">{children}</div>
                </details>
              </div>
            </div>
          )}
        </div>
        {candidate ? (
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
