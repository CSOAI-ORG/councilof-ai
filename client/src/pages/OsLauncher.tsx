import { useEffect, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  BOARD_PANE,
  DOOR_TO_LOBBY,
  DOORS,
  doorFromSearch,
  osLeaveForSearch,
  LOBBY_TO_DOOR,
} from "@/components/os/doors";
import OsHeader from "@/components/os/OsHeader";
import OsDoorBody from "@/components/os/OsDoors";
import LobbyOverlay from "@/components/lobby/LobbyOverlay";
import { isEmbedded } from "@/lib/embed";
import { osDoorHref, resolveIntent } from "@/lib/lobbyLink";
import { useBoardCount } from "@/lib/boardCount";

export {
  BOARD_PANE,
  DOOR_TO_LOBBY,
  DOORS,
  doorFromSearch,
  osLeaveForSearch,
  LOBBY_TO_DOOR,
};
export type { DoorId } from "@/components/os/doors";

const PAGES: { name: string; href: string; what: string }[] = [
  { name: "Board", href: "/gspc-scoreboard", what: "What’s actually measured. Empty stays empty." },
  { name: "Verify", href: "/gspc-verify", what: "Paste a card. Nothing is sent." },
  { name: "Assess", href: "/assess", what: "Get measured. Free. The card is yours." },
  { name: "Evidence", href: "/methodology", what: "How we grade. No model in the verdict." },
  { name: "Embed", href: "/embed", what: "Self-verifying badge. Measurement, not a mark." },
  { name: "Report", href: "/report", what: "Public incident intake. Signed acknowledgement." },
  { name: "Plugin", href: "/tools", what: "Paste-ready MCP for Claude, Cursor, Kimi, Grok." },
];

/** /os is the Council OS product workspace. Doors stay native. Not OsShell. Not AG-UI. */
export default function OsLauncher() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const leave = osLeaveForSearch(search);
  const door = doorFromSearch(search) ?? "board";
  const board = useBoardCount();
  const embedded = isEmbedded();
  const intent = useMemo(() => {
    const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    return resolveIntent({
      pane: p.get("lobby") ?? undefined,
      prompt: p.get("ask") ?? undefined,
      ctx: p.get("ctx") ?? undefined,
      task: p.get("task") ?? undefined,
    });
  }, [search]);

  useEffect(() => {
    document.title = "Council OS | councilof.ai";
  }, []);

  useEffect(() => {
    if (leave) setLocation(leave);
  }, [leave, setLocation]);

  if (embedded) {
    return (
      <div data-testid="os-directory">
        <OsHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <section aria-label="Council OS door">
            <OsDoorBody door={door} />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div data-testid="os-directory" className="flex h-[100dvh] flex-col bg-slate-50">
      <OsHeader />
      <p className="sr-only">
        Council OS — {board.public_count}. We measure. We do not certify.
      </p>
      <div className="min-h-0 flex-1">
        <LobbyOverlay
          mode="page"
          onClose={() => setLocation("/")}
          intent={intent}
          onHostTab={(t) => {
            if (t.id === "software") {
              setLocation("/dashboard");
              return;
            }
            setLocation(osDoorHref(t.id, search));
          }}
        />
      </div>
      <nav aria-label="Open as a full page" className="sr-only">
        <ul>
          {PAGES.map((p) => (
            <li key={p.href}>
              <Link href={p.href}>{p.name} — {p.what}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
