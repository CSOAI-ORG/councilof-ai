import { useState } from "react";
import LobbyChats from "@/components/lobby/LobbyChats";
import LobbyTaskRail from "@/components/lobby/LobbyTaskRail";
import type { LobbyChat } from "@/components/lobby/useLobbyChat";
import { readWorkspaceName, useActivity } from "@/components/lobby/workspace";
import { cn } from "@/lib/utils";

type RailTab = "workspace" | "tasks" | "chats";

export default function DashboardRightRail({ chat }: { chat: LobbyChat }) {
  const [tab, setTab] = useState<RailTab>("workspace");
  const activity = useActivity();
  const tabs: { id: RailTab; label: string }[] = [
    { id: "workspace", label: "Workspace" },
    { id: "tasks", label: "Tasks" },
    { id: "chats", label: "Chats" },
  ];

  return (
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-l border-border bg-card" aria-label="Workspace, tasks and chat history">
      <div role="tablist" aria-label="Workspace rail" className="grid grid-cols-3 gap-1 border-b border-border p-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              tab === item.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}{item.id === "chats" && chat.threads.length ? ` ${chat.threads.length}` : ""}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "workspace" ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current workspace</p>
              <p className="mt-1 font-semibold">{readWorkspaceName()}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Local to this browser. Conversation and activity are kept only for this page session.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</p>
              {activity.length ? (
                <ol className="mt-2 space-y-2">
                  {activity.slice(0, 10).map((entry) => (
                    <li key={`${entry.at}-${entry.label}`} className="rounded-lg border border-border p-2.5">
                      <p className="text-sm font-medium">{entry.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entry.kind} · {new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
        ) : null}
        {tab === "tasks" ? <LobbyTaskRail /> : null}
        {tab === "chats" ? <LobbyChats chat={chat} /> : null}
      </div>
    </aside>
  );
}
