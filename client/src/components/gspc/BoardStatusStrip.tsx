/**
 * BoardStatusStrip — a thin, persistent board-status line on every workspace pane except the home
 * (where the board card already prints the count: one figure per place). Pattern P10: always-visible
 * state with one action. Read from GET /api/gspc through the shared board read; never a price, never
 * a countdown.
 */
import { Link } from "wouter";
import { useGspcBoard } from "@/components/board/useGspcBoard";

export default function BoardStatusStrip() {
  const { data, error } = useGspcBoard();
  const count = typeof data?.totals?.public_count === "string" ? data.totals.public_count : null;
  const sep = typeof data?.totals?.separation_public_count === "string" ? data.totals.separation_public_count : null;
  return (
    <div className="flex min-h-9 items-center gap-3 border-t border-emerald-950/10 bg-[#04120c] px-3 text-xs text-emerald-50 sm:px-5" data-testid="ws-status-strip">
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      {error ? (
        <span className="min-w-0 truncate">Board unread ({error}); nothing shown in its place.</span>
      ) : count ? (
        <span className="min-w-0 truncate" title={sep ?? undefined}>
          <span className="font-mono font-bold text-white">{count}</span>
          {sep ? <span className="hidden text-emerald-100/85 md:inline"> · {sep}</span> : null}
        </span>
      ) : (
        <span role="status" className="min-w-0 truncate text-emerald-100/85">
          Reading the live board…
        </span>
      )}
      <Link href="/dashboard?tab=board" className="ml-auto inline-flex min-h-9 shrink-0 items-center font-bold text-emerald-300 underline underline-offset-2">
        Open the board
      </Link>
    </div>
  );
}
