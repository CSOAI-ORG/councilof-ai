/**
 * ArenaDoorPanel — the living door mechanic for Council Space.
 *
 * Room doors gated by GET /api/gspc:
 *   - OPEN (green): MEASURED model-comparison axes (except jail)
 *   - CLOSED (gray): UNMEASURED / PLANNED / DRAFT / SPEC axes
 *   - FLOOR (amber): jail (measured, but not a scored door)
 *
 * Empty stays empty. Jail is floor. No invented scores.
 */

import { useArenaDoors, type ArenaDoor, type DoorState } from "@/hooks/useArenaDoors";

const DOOR_TONE: Record<DoorState, string> = {
  open: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  closed: "border-slate-500/30 bg-slate-800/40 text-slate-400",
  floor: "border-amber-400/40 bg-amber-500/10 text-amber-200",
};

const DOOR_LABEL: Record<DoorState, string> = {
  open: "OPEN",
  closed: "CLOSED",
  floor: "FLOOR",
};

function DoorCard({ door }: { door: ArenaDoor }) {
  return (
    <div
      className={`rounded-lg border p-3 transition ${DOOR_TONE[door.state]}`}
      title={door.reason}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{door.axis}</div>
          <div className="font-mono text-[10px] opacity-70">{door.bench}</div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${DOOR_TONE[door.state]}`}
        >
          {DOOR_LABEL[door.state]}
        </span>
      </div>
      {door.state === "open" && door.accuracy !== null && (
        <div className="mt-2 font-mono text-[11px] tabular-nums">
          accuracy {door.accuracy.toFixed(3)} · n={door.n}
        </div>
      )}
      {door.state === "closed" && (
        <div className="mt-2 text-[11px] opacity-70">
          Empty stays empty — no invented score.
        </div>
      )}
      {door.state === "floor" && (
        <div className="mt-2 text-[11px] opacity-70">
          Measured floor (n={door.n}), not a scored door.
        </div>
      )}
    </div>
  );
}

export default function ArenaDoorPanel() {
  const { doors, openCount, closedCount, floorAxis, source, publicCount, loading, error } =
    useArenaDoors();

  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
        <div className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">
          Loading room doors from GET /api/gspc…
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
      <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/70">
            Arena doors · live from GET /api/gspc
          </div>
          <div className="mt-1 text-sm font-bold text-emerald-100">
            {openCount} open · {closedCount} closed
            {floorAxis && " · 1 floor (jail)"}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-emerald-300/50">
            source: {source}
          </div>
          <div className="font-mono text-[10px] text-emerald-300/70">{publicCount}</div>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded border border-amber-400/30 bg-amber-500/10 p-2 text-[11px] text-amber-200">
          Fallback to snapshot: {error}. The endpoint is the authority.
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {doors.map((door) => (
          <DoorCard key={door.axis} door={door} />
        ))}
      </div>

      <div className="mt-4 border-t border-emerald-500/15 pt-3 text-[11px] text-emerald-300/60">
        <strong>Mechanic:</strong> Room doors open only for MEASURED model-comparison axes.
        Jail is the floor (measured, but not a scored door). Empty stays empty — no invented
        scores. Every door state comes from GET /api/gspc.
      </div>
    </div>
  );
}
