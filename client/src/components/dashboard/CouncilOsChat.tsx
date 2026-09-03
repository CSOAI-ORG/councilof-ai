/**
 * CouncilOsChat — the conversation that IS the dashboard.
 *
 * Council OS was built twice. LobbyOverlay grew a chat, a tab rail and 22 panes and
 * floated over the site behind a badge; /dashboard kept an older stat-card page that
 * read no tab at all. Same destinations, two implementations, and the better one was
 * the one nobody could find. This mounts the overlay's chat as the centre of the real
 * dashboard so there is one workspace, not two.
 *
 * Chat is the main surface and stays mounted. Choosing a tab does not navigate away and
 * does not replace the conversation — DashboardLayout renders that tab's pane as a card
 * above this, and the thread is still underneath it.
 */
import { useRef } from "react";
import { useLocation } from "wouter";
import LobbyThread from "@/components/lobby/LobbyThread";
import LobbyComposer from "@/components/lobby/LobbyComposer";
import { useLobbyChat } from "@/components/lobby/useLobbyChat";
import type { LobbyTab } from "@/components/lobby/tabs";

export default function CouncilOsChat({
  paneLabel = "Council OS",
  panePath = "/dashboard",
}: {
  /** Names the surface the reader is looking at, so the composer can answer about it. */
  paneLabel?: string;
  panePath?: string;
}) {
  const chat = useLobbyChat();
  const [, setLocation] = useLocation();
  const endRef = useRef<HTMLDivElement | null>(null);

  /** A tab chosen from inside the conversation opens as a pane in this same shell —
   *  the OS never throws the reader out to the standalone page. */
  const onNavigate = (tab: LobbyTab) => setLocation(`/dashboard?tab=${tab.id}`);

  const empty = (chat.active?.turns?.length ?? 0) === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="mx-auto max-w-2xl px-6 py-10">
            <h1 className="text-2xl font-bold text-foreground">Council OS</h1>
            <p className="mt-2 text-muted-foreground">
              Ask about the board, a signed card, or which duties bind you. Answers come from
              published measurement — if a thing is not measured, you get told that rather than
              a guess.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>· “What does the board actually measure?”</li>
              <li>· “Is this card real?” — then open Verify from the rail</li>
              <li>· “What applies to me before December?”</li>
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Pick a tab on the left and it opens here, above this conversation — the thread
              stays where it is.
            </p>
          </div>
        ) : (
          <LobbyThread chat={chat} endRef={endRef} />
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-background/95 p-3">
        <LobbyComposer
          chat={chat}
          onNavigate={onNavigate}
          paneLabel={paneLabel}
          panePath={panePath}
        />
      </div>
    </div>
  );
}
