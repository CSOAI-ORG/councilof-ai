/**
 * BoardStatusStrip — a thin, persistent board-status line on every workspace pane except the home
 * (where the board card already prints the count: one figure per place). Pattern P10: always-visible
 * state with one action. Read from GET /api/gspc through the shared board read; never a price, never
 * a countdown.
 *
 * 2026-11-02: also carries the tools-door state in words ("tools door answering / not answering"),
 * read from tools/list on /mcp/free through the cached listTools. A state word, not a figure — the
 * free-tool count stays on the home card that cites its own source. When the door cannot be asked,
 * the strip says so plainly instead of leaving a permanently "connecting" badge (the same rule the
 * tools audit of 2026-08-26 set for ToolRunner).
 *
 * 2026-11-18: the build's prerender does not ask the door (readToolsDoor), so the saved HTML keeps
 * the neutral "asking" state instead of a "not answering" the build itself caused.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGspcBoard } from "@/components/board/useGspcBoard";
import { boardRunDates } from "@/lib/boardRunDates";
import { listTools } from "@/lib/sovTools";

type DoorState = "asking" | "answering" | "not-answering";

/**
 * The tools-door state to show. The build saves this strip into static HTML by running the page
 * in a prerender (scripts/prerender.mjs sets window.__CSOAI_PRERENDER__), where mcpRpc refuses
 * every MCP request. Asking there saved "tools door not answering (retry shortly)" into /assess/
 * and /dashboard/?tab=verify while /mcp/free answered with 49 tools (live, 18 Nov 2026). So the
 * prerender does not ask: the saved HTML keeps "asking", and the visitor's browser asks on load.
 */
export async function readToolsDoor(
  list: (door: "/mcp/free") => Promise<{ state: string }> = listTools,
  w: { __CSOAI_PRERENDER__?: boolean } | undefined = typeof window === "undefined"
    ? undefined
    : (window as Window & { __CSOAI_PRERENDER__?: boolean }),
): Promise<DoorState> {
  if (w?.__CSOAI_PRERENDER__) return "asking";
  const reply = await list("/mcp/free");
  return reply.state === "ok" ? "answering" : "not-answering";
}

export default function BoardStatusStrip() {
  const { data, error } = useGspcBoard();
  const count = typeof data?.totals?.public_count === "string" ? data.totals.public_count : null;
  const sep = typeof data?.totals?.separation_public_count === "string" ? data.totals.separation_public_count : null;
  // measured_on.date from the same payload (surface inspection, 12 Oct 2026); never typed.
  const measuredOn = boardRunDates(data as Parameters<typeof boardRunDates>[0]);
  const [door, setDoor] = useState<DoorState>("asking");
  useEffect(() => {
    let cancelled = false;
    readToolsDoor().then((state) => {
      if (!cancelled) setDoor(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="flex min-h-9 items-center gap-3 border-t border-emerald-950/10 bg-[#04120c] px-3 text-xs text-emerald-50 sm:px-5" data-testid="ws-status-strip">
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className={`relative inline-flex h-2 w-2 rounded-full ${door === "not-answering" ? "bg-amber-400" : "bg-emerald-400"}`} />
      </span>
      {error ? (
        <span className="min-w-0 truncate">Board unread ({error}); nothing shown in its place.</span>
      ) : count ? (
        <span className="min-w-0 truncate" title={sep ?? undefined}>
          <span className="font-mono font-bold text-white">{count}</span>
          {measuredOn ? <span className="text-emerald-100/85" data-testid="ws-status-measured-on"> · measured on {measuredOn}</span> : null}
          {sep ? <span className="hidden text-emerald-100/85 md:inline"> · {sep}</span> : null}
        </span>
      ) : (
        <span role="status" className="min-w-0 truncate text-emerald-100/85">
          Reading the live board…
        </span>
      )}
      <span
        className="hidden shrink-0 text-emerald-100/85 sm:inline"
        data-testid="ws-status-door"
        title="State of POST /mcp/free → tools/list, the free tools door. Read through the same listing the tool panes use."
      >
        {door === "asking" ? " · asking the tools door…" : ` · tools door ${door === "answering" ? "answering" : "not answering (retry shortly)"}`}
      </span>
      <Link href="/dashboard?tab=board" className="ml-auto inline-flex min-h-9 shrink-0 items-center font-bold text-emerald-300 underline underline-offset-2">
        Open the board
      </Link>
    </div>
  );
}
