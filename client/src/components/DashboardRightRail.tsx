import { useEffect, useRef, useState } from "react";
import LobbyChats from "@/components/lobby/LobbyChats";
import LobbyThread from "@/components/lobby/LobbyThread";
import LobbyTaskRail from "@/components/lobby/LobbyTaskRail";
import type { LobbyChat } from "@/components/lobby/useLobbyChat";
import { readWorkspaceName, useActivity } from "@/components/lobby/workspace";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearch } from "wouter";

type RailTab = "workspace" | "tasks" | "chats";
type ChatView = "conversation" | "history";

/**
 * The current thread and its session-only history belong in the same rail.
 * When the centre canvas becomes a tool, this is the conversation that remains
 * beside it rather than disappearing behind a list of thread titles.
 */
export function DashboardChatRail({ chat }: { chat: LobbyChat }) {
  const [view, setView] = useState<ChatView>("conversation");
  const endRef = useRef<HTMLDivElement>(null);
  const turns = chat.active?.turns ?? [];

  useEffect(() => {
    if (!chat.turnCount) return;
    setView("conversation");
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.turnCount]);

  // Selecting a title in History opens that thread instead of changing an
  // invisible activeId behind the history list.
  useEffect(() => {
    if (chat.activeId) setView("conversation");
  }, [chat.activeId]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid="dashboard-chat-rail"
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-border p-2">
        <button
          type="button"
          onClick={() => setView("conversation")}
          aria-pressed={view === "conversation"}
          className={cn(
            "min-h-9 flex-1 rounded-md px-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            view === "conversation"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Current conversation
        </button>
        <button
          type="button"
          onClick={() => setView("history")}
          aria-pressed={view === "history"}
          className={cn(
            "min-h-9 rounded-md px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            view === "history"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          History{chat.threads.length ? ` ${chat.threads.length}` : ""}
        </button>
      </div>

      {view === "conversation" ? (
        turns.length ? (
          <div className="flex min-h-0 flex-1 flex-col [&>[role=log]]:px-3 [&>[role=log]]:py-3">
            <LobbyThread chat={chat} endRef={endRef} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
            <p className="text-sm font-medium text-foreground">
              No active conversation.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ask from the composer below the centre canvas, or choose a thread
              from this browser session&apos;s history.
            </p>
            {chat.threads.length > 0 && (
              <button
                type="button"
                onClick={() => setView("history")}
                className="mt-3 text-xs font-semibold text-emerald-800 hover:underline"
              >
                Open thread history
              </button>
            )}
          </div>
        )
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <LobbyChats chat={chat} />
        </div>
      )}

      {view === "conversation" && (
        <p className="shrink-0 border-t border-border px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
          Stored only in this browser tab&apos;s session. Reloading restores it;
          Clear history removes it.
        </p>
      )}
    </div>
  );
}

export default function DashboardRightRail({
  chat,
  className,
}: {
  chat: LobbyChat;
  className?: string;
}) {
  const [tab, setTab] = useState<RailTab>("workspace");
  const activity = useActivity();
  const search = useSearch();
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const centreOwnsTool =
    (params.get("tab") || "home") !== "home" || params.has("view");

  // A new answer should remain visible when a working pane owns the centre.
  // On the conversation home we leave the rail on Workspace, avoiding a second
  // copy of the same live log beside the centre-thread view.
  useEffect(() => {
    if (centreOwnsTool && chat.turnCount > 0) setTab("chats");
  }, [centreOwnsTool, chat.turnCount]);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as RailTab)}
      asChild
    >
      <aside
        className={cn(
          "flex h-full min-h-0 w-80 shrink-0 flex-col border-l border-border bg-card",
          className,
        )}
        aria-label="Workspace, tasks and chat history"
      >
        <TabsList
          aria-label="Workspace rail"
          className="grid h-auto w-full grid-cols-3 gap-1 rounded-none border-b border-border bg-transparent p-2"
        >
          <TabsTrigger value="workspace" className="px-2 py-1.5 text-xs">
            Workspace
          </TabsTrigger>
          <TabsTrigger value="tasks" className="px-2 py-1.5 text-xs">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="chats" className="px-2 py-1.5 text-xs">
            Chats{chat.threads.length ? ` ${chat.threads.length}` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="workspace"
          className="mt-0 min-h-0 flex-1 overflow-y-auto p-4"
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current workspace
              </p>
              <p className="mt-1 font-semibold">{readWorkspaceName()}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Local to this browser. Conversation is retained in this tab&apos;s
                bounded session storage; activity remains session-only.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Activity
              </p>
              {activity.length ? (
                <ol className="mt-2 space-y-2">
                  {activity.slice(0, 10).map((entry) => (
                    <li
                      key={`${entry.at}-${entry.label}`}
                      className="rounded-lg border border-border p-2.5"
                    >
                      <p className="text-sm font-medium">{entry.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entry.kind} ·{" "}
                        {new Date(entry.at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Open a pane or start a task and it will appear here.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent
          value="tasks"
          className="mt-0 min-h-0 flex-1 overflow-y-auto p-4"
        >
          <LobbyTaskRail />
        </TabsContent>
        <TabsContent
          value="chats"
          className="mt-0 min-h-0 flex-1 overflow-hidden p-0"
        >
          <DashboardChatRail chat={chat} />
        </TabsContent>
      </aside>
    </Tabs>
  );
}
