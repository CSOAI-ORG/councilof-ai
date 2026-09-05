import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  PanelRightOpen,
  PlugZap,
  ShieldCheck,
  Swords,
  Wrench,
} from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import DashboardRightRail from "@/components/DashboardRightRail";
import CandidateEvidenceTray from "@/components/CandidateEvidenceTray";
import LobbyComposer, {
  type ComposerTool,
} from "@/components/lobby/LobbyComposer";
import LobbyThread from "@/components/lobby/LobbyThread";
import { LOBBY_TABS, type LobbyTab } from "@/components/lobby/tabs";
import { useLobbyChat } from "@/components/lobby/useLobbyChat";
import { recordActivity } from "@/components/lobby/workspace";
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

  const visibleTools = tools.slice(0, 6);
  const hasConversation = Boolean(chat.active?.turns.length);

  return (
    <div
      className="relative flex h-full min-h-0 bg-muted/20"
      data-testid="dashboard-workspace"
    >
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="absolute right-3 top-3 z-20 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm hover:bg-accent xl:hidden"
            aria-label="Open workspaces, tasks and chat history"
          >
            <PanelRightOpen className="h-4 w-4" aria-hidden="true" /> Workspace
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
      <section
        className="flex min-w-0 flex-1 flex-col"
        aria-label="Council workspace canvas"
      >
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
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
              <div className="mx-auto w-full min-w-0 max-w-4xl">
                <div className="mx-auto max-w-3xl text-center">
                  <nav
                    aria-label="Council workspace modes"
                    className="mx-auto mt-12 flex w-fit flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm xl:mt-0"
                  >
                    <span
                      className="rounded-full bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white"
                      aria-current="page"
                    >
                      Council chat
                    </span>
                    <Link
                      href="/dashboard?tab=space"
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Model arena
                    </Link>
                    <Link
                      href="/dashboard?tab=learn"
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Learn
                    </Link>
                    <Link
                      href="/dashboard?tab=play"
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Games
                    </Link>
                    <Link
                      href="/dashboard?tab=tools"
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Tools
                    </Link>
                  </nav>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                    Council of AI governed workspace
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    What should the Council help you do?
                  </h1>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Ask once, then keep the conversation, selected tools and
                    evidence together. The composer below is the control point;
                    starter actions only prefill or open a real surface.
                  </p>

                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                    <Link
                      href="/dashboard?tab=space"
                      className="group rounded-2xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Swords
                          className="h-4 w-4 text-emerald-800"
                          aria-hidden="true"
                        />
                        Inspect a model arena
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        Recorded rounds and deterministic grading; never a
                        pretend live battle.
                      </span>
                    </Link>
                    <Link
                      href="/dashboard?tab=learn"
                      className="group rounded-2xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <BookOpenCheck
                          className="h-4 w-4 text-emerald-800"
                          aria-hidden="true"
                        />
                        Train on a GSPC axis
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        Learn, play, explain, propose a fix, then stop for human
                        review.
                      </span>
                    </Link>
                    <Link
                      href="/dashboard?tab=verify"
                      className="group rounded-2xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ShieldCheck
                          className="h-4 w-4 text-emerald-800"
                          aria-hidden="true"
                        />
                        Verify evidence
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        Recompute a card hash and signature in the browser.
                      </span>
                    </Link>
                    <Link
                      href={`/dashboard?tab=home&ask=${encodeURIComponent(
                        "Help me diagnose a failed AI governance check. Explain the evidence, propose a reversible fix and verification test, then wait for my approval before any action.",
                      )}`}
                      className="group rounded-2xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Wrench
                          className="h-4 w-4 text-emerald-800"
                          aria-hidden="true"
                        />
                        Diagnose and draft a fix
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        Prefills the Council—not sent, executed or approved
                        automatically.
                      </span>
                    </Link>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                    <Link
                      href="/dashboard?tab=explore"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:underline"
                    >
                      Browse every tool and page{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/dashboard?tab=fabric"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:underline"
                    >
                      Inspect live connections{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <section aria-labelledby="available-tools" className="mt-8">
                  <div className="flex items-center justify-between gap-3">
                    <h2
                      id="available-tools"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <PlugZap className="h-4 w-4 text-emerald-700" /> MCP tool
                      catalogue
                    </h2>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      {toolPhase === "loading"
                        ? "reading tools/list…"
                        : toolPhase === "failed"
                          ? "catalogue unreachable"
                          : `${tools.length} declared by tools/list`}
                      {toolPhase === "ready" && tools.length ? (
                        <Link
                          href="/dashboard?tab=tools"
                          className="font-semibold text-emerald-800 hover:underline"
                        >
                          Open all
                        </Link>
                      ) : null}
                    </span>
                  </div>
                  {toolPhase === "failed" ? (
                    <p
                      role="alert"
                      className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
                    >
                      The MCP endpoint did not answer, so no capability is
                      claimed here. The direct dashboard panes remain available
                      from the left rail.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                      {visibleTools.map((tool) => (
                        <button
                          key={tool.name}
                          type="button"
                          onClick={() => selectTool(tool)}
                          className="min-w-0 rounded-xl border border-border bg-card p-4 text-left transition hover:border-emerald-600/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                        >
                          <code className="text-xs font-semibold text-emerald-800">
                            {tool.name}
                          </code>
                          <span className="mt-2 block break-words text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                            {tool.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {toolPhase === "ready" ? (
                    <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                      Catalogue discovery is live. A tool becomes
                      runtime-observed only after its own tools/call completes.
                    </p>
                  ) : null}
                </section>

                <details className="mt-8 rounded-xl border border-border bg-background">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
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
        />
      </section>
      <div className="hidden min-h-0 xl:block">
        <DashboardRightRail chat={chat} />
      </div>
    </div>
  );
}
