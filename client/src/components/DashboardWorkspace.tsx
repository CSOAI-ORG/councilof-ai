import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, PlugZap } from "lucide-react";
import { useLocation } from "wouter";
import DashboardRightRail from "@/components/DashboardRightRail";
import LobbyComposer, { type ComposerTool } from "@/components/lobby/LobbyComposer";
import LobbyThread from "@/components/lobby/LobbyThread";
import { LOBBY_TABS, type LobbyTab } from "@/components/lobby/tabs";
import { useLobbyChat } from "@/components/lobby/useLobbyChat";
import { recordActivity } from "@/components/lobby/workspace";

type ToolPhase = "loading" | "ready" | "failed";

const TOOL_PANES: Record<string, string> = {
  board_totals: "board",
  get_axis: "board",
  verify_card: "verify",
  list_cards: "cards",
  get_root: "attestations",
  get_card: "cards",
  verify_inclusion: "attestations",
  commission_card: "measured",
  art50_marking_evidence: "art50",
  rwa_evidence: "evidence",
  witness_hash: "attestations",
  receipts_batch: "archive",
};

export function paneForTool(name: string): string {
  return TOOL_PANES[name] || "tools";
}

function shortDescription(description: string): string {
  const sentence = description.split(/(?<=[.!?])\s/)[0]?.trim();
  return sentence || "Published MCP capability.";
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
  const chat = useLobbyChat();
  const threadEndRef = useRef<HTMLDivElement>(null);
  const [tools, setTools] = useState<ComposerTool[]>([]);
  const [toolPhase, setToolPhase] = useState<ToolPhase>("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "dashboard-tools", method: "tools/list", params: {} }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        if (!Array.isArray(body?.result?.tools)) throw new Error("tools/list returned no tool array");
        return body.result.tools as { name?: unknown; description?: unknown }[];
      })
      .then((items) => {
        setTools(items
          .filter((tool) => typeof tool.name === "string")
          .map((tool) => ({ name: String(tool.name), description: shortDescription(String(tool.description || "")) })));
        setToolPhase("ready");
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setToolPhase("failed");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.turnCount]);

  const navigate = useCallback((tab: LobbyTab) => {
    recordActivity({ kind: "pane", label: tab.label, tabId: tab.id });
    setLocation(`/dashboard?tab=${tab.id}`);
  }, [setLocation]);

  const openRoute = useCallback((path: string, label: string) => {
    const tab = LOBBY_TABS.find((candidate) => candidate.path === path);
    if (tab) {
      navigate(tab);
      return;
    }
    recordActivity({ kind: "route", label, path });
    window.location.assign(path);
  }, [navigate]);

  const selectTool = useCallback((tool: ComposerTool) => {
    const paneId = paneForTool(tool.name);
    const tab = LOBBY_TABS.find((candidate) => candidate.id === paneId);
    if (tab) navigate(tab);
  }, [navigate]);

  const visibleTools = useMemo(() => tools.slice(0, 7), [tools]);
  const hasConversation = Boolean(chat.active?.turns.length);

  return (
    <div className="flex h-full min-h-0 bg-muted/20" data-testid="dashboard-workspace">
      <section className="flex min-w-0 flex-1 flex-col" aria-label="Council workspace canvas">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activePane ? (
            <>
              <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
                <button
                  type="button"
                  onClick={() => setLocation("/dashboard?tab=home")}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Conversation
                </button>
                <span aria-hidden="true" className="text-muted-foreground">/</span>
                <span className="truncate text-sm font-medium">{activeLabel || activeTab}</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-background" data-testid="dashboard-tool-canvas">
                {activePane}
              </div>
            </>
          ) : hasConversation ? (
            <LobbyThread chat={chat} endRef={threadEndRef} />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
              <div className="mx-auto max-w-4xl">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Council workspace</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">What are you working on?</h1>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Ask about published measurements, open a working surface, or choose a capability from the live MCP catalogue. No model tournament is implied: the Council answers through the runtime that is actually available.
                  </p>
                </div>

                <section aria-labelledby="available-tools" className="mt-8">
                  <div className="flex items-center justify-between gap-3">
                    <h2 id="available-tools" className="flex items-center gap-2 text-sm font-semibold">
                      <PlugZap className="h-4 w-4 text-emerald-700" /> Available MCP capabilities
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {toolPhase === "loading" ? "reading tools/list…" : toolPhase === "failed" ? "catalogue unreachable" : `${tools.length} returned live`}
                    </span>
                  </div>
                  {toolPhase === "failed" ? (
                    <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                      The MCP endpoint did not answer, so no capability is claimed here. The direct dashboard panes remain available from the left rail.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleTools.map((tool) => (
                        <button
                          key={tool.name}
                          type="button"
                          onClick={() => selectTool(tool)}
                          className="rounded-xl border border-border bg-card p-4 text-left transition hover:border-emerald-600/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                        >
                          <code className="text-xs font-semibold text-emerald-800">{tool.name}</code>
                          <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{tool.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <details className="mt-8 rounded-xl border border-border bg-background">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Account overview and recent measurements</summary>
                  <div className="border-t border-border">{children}</div>
                </details>
              </div>
            </div>
          )}
        </div>
        <LobbyComposer
          chat={chat}
          onNavigate={navigate}
          onOpenRoute={openRoute}
          paneLabel={activeLabel || "Conversation"}
          panePath={activePane ? `/dashboard?tab=${activeTab}` : "/dashboard"}
          tools={tools}
          onTool={selectTool}
        />
      </section>
      <div className="hidden min-h-0 xl:block">
        <DashboardRightRail chat={chat} />
      </div>
    </div>
  );
}
